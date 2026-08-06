import Stripe from 'https://esm.sh/stripe@17.7.0?target=deno';
import { corsHeaders, jsonResponse } from '../_shared/cors.ts';
import { getStripe } from '../_shared/stripe.ts';
import {
  getServiceSupabase,
  markOrderPaid,
  sendOrderConfirmationEmailIfNeeded,
  sendReviewRequestEmailIfNeeded,
} from '../_shared/orders.ts';

async function handlePaymentIntentSucceeded(
  supabase: ReturnType<typeof getServiceSupabase>,
  paymentIntent: Stripe.PaymentIntent,
) {
  const orderNumber = paymentIntent.metadata?.order_number;
  if (!orderNumber) return;

  const { data: order } = await supabase
    .from('orders')
    .select('id, status, subtotal_cents')
    .eq('order_number', orderNumber)
    .maybeSingle();

  if (!order || order.status === 'paid' || order.status === 'refunded') return;
  if (paymentIntent.amount !== order.subtotal_cents) return;

  await markOrderPaid(supabase, order.id, paymentIntent);
  try {
    await sendOrderConfirmationEmailIfNeeded(supabase, order.id);
  } catch (emailError) {
    console.error('Order confirmation email failed:', emailError);
  }
  try {
    await sendReviewRequestEmailIfNeeded(supabase, order.id);
  } catch (emailError) {
    console.error('Review request email failed:', emailError);
  }
}

async function handlePaymentIntentFailed(
  supabase: ReturnType<typeof getServiceSupabase>,
  paymentIntent: Stripe.PaymentIntent,
) {
  const declineCode = paymentIntent.last_payment_error?.decline_code;
  if (declineCode === 'currency_not_supported') {
    return;
  }

  const orderNumber = paymentIntent.metadata?.order_number;
  if (!orderNumber) return;

  const now = new Date().toISOString();
  await supabase
    .from('orders')
    .update({
      status: 'failed',
      stripe_payment_intent_id: paymentIntent.id,
      payment_provider: 'stripe',
      updated_at: now,
    })
    .eq('order_number', orderNumber)
    .in('status', ['pending']);
}

async function handleChargeRefunded(
  supabase: ReturnType<typeof getServiceSupabase>,
  charge: Stripe.Charge,
) {
  const paymentIntentId =
    typeof charge.payment_intent === 'string'
      ? charge.payment_intent
      : charge.payment_intent?.id;

  if (!paymentIntentId) return;

  const now = new Date().toISOString();
  await supabase
    .from('orders')
    .update({
      status: 'refunded',
      stripe_charge_id: charge.id,
      updated_at: now,
    })
    .eq('stripe_payment_intent_id', paymentIntentId);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
  if (!webhookSecret) {
    return jsonResponse({ error: 'Webhook not configured' }, 503);
  }

  try {
    const stripe = getStripe();
    const supabase = getServiceSupabase();
    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      return jsonResponse({ error: 'Missing Stripe signature' }, 400);
    }

    const body = await req.text();
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(supabase, event.data.object as Stripe.PaymentIntent);
        break;
      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(supabase, event.data.object as Stripe.PaymentIntent);
        break;
      case 'charge.refunded':
        await handleChargeRefunded(supabase, event.data.object as Stripe.Charge);
        break;
      default:
        break;
    }

    return jsonResponse({ received: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Webhook handler failed';
    return jsonResponse({ error: message }, 400);
  }
});
