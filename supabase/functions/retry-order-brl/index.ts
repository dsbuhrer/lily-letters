import { corsHeaders, jsonResponse } from '../_shared/cors.ts';
import { createBrlQuoteFromUsd, retrieveBrlQuote } from '../_shared/fxQuotes.ts';
import { getStripe } from '../_shared/stripe.ts';
import { getServiceSupabase } from '../_shared/orders.ts';

function normalizeEmail(value: unknown) {
  return String(value || '').toLowerCase().trim();
}

async function authorizeOrderAccess(
  order: { email: string; user_id: string | null },
  email: string,
  userId: string | null,
) {
  if (userId && order.user_id && order.user_id === userId) return;
  if (userId && !order.user_id && normalizeEmail(order.email) === normalizeEmail(email)) return;
  if (!userId && normalizeEmail(order.email) === normalizeEmail(email)) return;
  throw new Error('You do not have access to this order.');
}

type OrderRow = {
  id: string;
  order_number: string;
  email: string;
  user_id: string | null;
  status: string;
  subtotal_cents: number;
  currency: string;
  stripe_payment_intent_id: string | null;
  original_subtotal_cents: number | null;
  original_currency: string | null;
};

function getUsdCents(order: OrderRow): number {
  if (order.original_subtotal_cents && order.original_currency === 'USD') {
    return order.original_subtotal_cents;
  }
  if (order.currency === 'USD') {
    return order.subtotal_cents;
  }
  throw new Error('Order is not eligible for BRL retry.');
}

async function loadOrder(supabase: ReturnType<typeof getServiceSupabase>, orderNumber: string) {
  const { data: order, error } = await supabase
    .from('orders')
    .select(
      'id, order_number, email, user_id, status, subtotal_cents, currency, stripe_payment_intent_id, original_subtotal_cents, original_currency',
    )
    .eq('order_number', orderNumber)
    .maybeSingle();

  if (error) throw error;
  if (!order) return null;
  return order as OrderRow;
}

function validateOrderForBrlRetry(order: OrderRow) {
  if (order.status === 'paid') {
    throw new Error('This order has already been paid.');
  }
  if (order.status === 'refunded') {
    throw new Error('This order has been refunded.');
  }
  if (order.currency === 'BRL' && order.status === 'pending') {
    throw new Error('Order is already converted to BRL. Complete payment with the updated amount.');
  }
  if (order.currency !== 'USD') {
    throw new Error('Order is not eligible for BRL retry.');
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  try {
    const supabase = getServiceSupabase();
    const stripe = getStripe();
    const body = await req.json();

    const orderNumber = String(body.orderNumber || '').trim();
    const email = normalizeEmail(body.email);
    const userId = body.userId || null;
    const preview = Boolean(body.preview);
    const confirm = Boolean(body.confirm);
    const fxQuoteId = String(body.fxQuoteId || '').trim();

    if (!orderNumber) {
      return jsonResponse({ error: 'Order number is required.' }, 400);
    }
    if (!email) {
      return jsonResponse({ error: 'Email is required.' }, 400);
    }
    if (!preview && !confirm) {
      return jsonResponse({ error: 'Either preview or confirm must be true.' }, 400);
    }
    if (confirm && !fxQuoteId) {
      return jsonResponse({ error: 'FX quote ID is required for confirmation.' }, 400);
    }

    const order = await loadOrder(supabase, orderNumber);
    if (!order) return jsonResponse({ error: 'Order not found.' }, 404);

    await authorizeOrderAccess(order, email, userId);
    validateOrderForBrlRetry(order);

    const usdCents = getUsdCents(order);

    if (preview) {
      const quote = await createBrlQuoteFromUsd(stripe, usdCents);
      return jsonResponse({
        brlAmount: quote.brlCents / 100,
        brlCents: quote.brlCents,
        usdAmount: quote.usdCents / 100,
        usdCents: quote.usdCents,
        fxQuoteId: quote.fxQuoteId,
        exchangeRate: quote.exchangeRate,
        lockExpiresAt: quote.lockExpiresAt,
        currency: 'BRL',
      });
    }

    let quote;
    try {
      quote = await retrieveBrlQuote(stripe, fxQuoteId, usdCents);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'FX quote validation failed.';
      if (message === 'fx_quote_expired') {
        return jsonResponse({ error: 'FX quote expired. Please preview again.', code: 'fx_quote_expired' }, 409);
      }
      throw e;
    }

    const oldPaymentIntentId = order.stripe_payment_intent_id;
    if (oldPaymentIntentId) {
      try {
        const oldPi = await stripe.paymentIntents.retrieve(oldPaymentIntentId);
        if (['requires_payment_method', 'requires_confirmation', 'requires_action'].includes(oldPi.status)) {
          await stripe.paymentIntents.cancel(oldPaymentIntentId);
        }
      } catch (cancelError) {
        console.warn('Could not cancel previous USD PaymentIntent:', cancelError);
      }
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: quote.brlCents,
      currency: 'brl',
      payment_method_types: ['card'],
      receipt_email: email,
      description: `Order ${order.order_number} — Lilly Letters`,
      statement_descriptor_suffix: 'LILLY LETTERS',
      fx_quote: quote.fxQuoteId,
      metadata: {
        order_id: order.id,
        order_number: order.order_number,
        original_currency: 'USD',
        original_subtotal_cents: String(usdCents),
      },
    });

    if (!paymentIntent.client_secret) {
      throw new Error('Stripe did not return a client secret.');
    }

    const now = new Date().toISOString();
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        status: 'pending',
        subtotal_cents: quote.brlCents,
        currency: 'BRL',
        stripe_payment_intent_id: paymentIntent.id,
        original_subtotal_cents: usdCents,
        original_currency: 'USD',
        stripe_fx_quote_id: quote.fxQuoteId,
        updated_at: now,
      })
      .eq('id', order.id);

    if (updateError) throw updateError;

    return jsonResponse({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      brlAmount: quote.brlCents / 100,
      brlCents: quote.brlCents,
      usdAmount: quote.usdCents / 100,
      usdCents: quote.usdCents,
      fxQuoteId: quote.fxQuoteId,
      exchangeRate: quote.exchangeRate,
      currency: 'BRL',
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to retry order in BRL';
    const status = message.includes('access') ? 403 : 500;
    return jsonResponse({ error: message }, status);
  }
});
