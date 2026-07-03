import { corsHeaders, jsonResponse } from '../_shared/cors.ts';
import { getStripe } from '../_shared/stripe.ts';
import {
  buildOrderItemsResponse,
  fetchOrderItems,
  getServiceSupabase,
  markOrderPaid,
  validatePaymentIntent,
} from '../_shared/orders.ts';

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

async function buildPaidResponse(
  supabase: ReturnType<typeof getServiceSupabase>,
  order: {
    id: string;
    order_number: string;
    email: string;
    status: string;
    subtotal_cents: number;
    billing_name: string | null;
  },
) {
  const orderItems = await fetchOrderItems(supabase, order.id);
  const items = await buildOrderItemsResponse(supabase, orderItems);

  return {
    orderId: order.order_number,
    id: order.id,
    email: order.email,
    firstName: order.billing_name?.split(' ')[0] || '',
    status: order.status,
    total: order.subtotal_cents / 100,
    items,
  };
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
    const paymentIntentId = String(body.paymentIntentId || '').trim() || null;

    if (!orderNumber) {
      return jsonResponse({ error: 'Order number is required.' }, 400);
    }
    if (!email) {
      return jsonResponse({ error: 'Email is required.' }, 400);
    }

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(
        'id, order_number, email, user_id, status, subtotal_cents, currency, paid_at, billing_name, stripe_payment_intent_id',
      )
      .eq('order_number', orderNumber)
      .maybeSingle();

    if (orderError) throw orderError;
    if (!order) return jsonResponse({ error: 'Order not found.' }, 404);

    await authorizeOrderAccess(order, email, userId);

    if (order.status === 'failed') {
      return jsonResponse({ error: 'Payment failed for this order.', status: 'failed' }, 402);
    }
    if (order.status === 'refunded') {
      return jsonResponse({ error: 'This order has been refunded.', status: 'refunded' }, 402);
    }

    if (order.status === 'paid') {
      return jsonResponse(await buildPaidResponse(supabase, order));
    }

    const intentId = paymentIntentId || order.stripe_payment_intent_id;
    if (!intentId) {
      return jsonResponse({ error: 'Payment is still processing.', status: 'pending' }, 409);
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(intentId);

    if (paymentIntent.status === 'processing') {
      return jsonResponse({ error: 'Payment is still processing.', status: 'pending' }, 409);
    }

    if (paymentIntent.status !== 'succeeded') {
      return jsonResponse({ error: 'Payment has not been completed.', status: order.status }, 402);
    }

    validatePaymentIntent(paymentIntent, order);
    const paidOrder = await markOrderPaid(supabase, order.id, paymentIntent);

    return jsonResponse(await buildPaidResponse(supabase, { ...paidOrder, status: 'paid' }));
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to load order confirmation';
    const status = message.includes('access') ? 403 : 500;
    return jsonResponse({ error: message }, status);
  }
});
