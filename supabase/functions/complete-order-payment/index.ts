import { corsHeaders, jsonResponse } from '../_shared/cors.ts';
import { getStripe } from '../_shared/stripe.ts';
import {
  buildOrderItemsResponse,
  fetchOrderItems,
  getServiceSupabase,
  markOrderPaid,
  sendOrderConfirmationEmailIfNeeded,
  sendReviewRequestEmailIfNeeded,
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
    const paymentIntentId = String(body.paymentIntentId || '').trim();
    const email = normalizeEmail(body.email);
    const userId = body.userId || null;

    if (!orderNumber || !paymentIntentId) {
      return jsonResponse({ error: 'Order number and payment intent are required.' }, 400);
    }
    if (!email) {
      return jsonResponse({ error: 'Email is required.' }, 400);
    }

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, order_number, email, user_id, status, subtotal_cents, currency, paid_at, billing_name')
      .eq('order_number', orderNumber)
      .maybeSingle();

    if (orderError) throw orderError;
    if (!order) return jsonResponse({ error: 'Order not found.' }, 404);

    await authorizeOrderAccess(order, email, userId);

    if (order.status === 'failed') {
      return jsonResponse({ error: 'Payment failed for this order.' }, 402);
    }
    if (order.status === 'refunded') {
      return jsonResponse({ error: 'This order has been refunded.' }, 402);
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    validatePaymentIntent(paymentIntent, order);

    let paidOrder = order;
    if (order.status !== 'paid') {
      paidOrder = await markOrderPaid(supabase, order.id, paymentIntent);
    }

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

    const orderItems = await fetchOrderItems(supabase, order.id);
    const items = await buildOrderItemsResponse(supabase, orderItems);

    return jsonResponse({
      orderId: paidOrder.order_number,
      id: paidOrder.id,
      email: paidOrder.email,
      firstName: paidOrder.billing_name?.split(' ')[0] || '',
      status: 'paid',
      total: paidOrder.subtotal_cents / 100,
      items,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to complete payment';
    const status = message.includes('access') ? 403 : 500;
    return jsonResponse({ error: message }, status);
  }
});
