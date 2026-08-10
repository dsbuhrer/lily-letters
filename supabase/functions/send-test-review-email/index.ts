import { corsHeaders, jsonResponse } from '../_shared/cors.ts';
import { sendReviewRequestEmail } from '../_shared/orderEmail.ts';
import { fetchOrderItems, getServiceSupabase } from '../_shared/orders.ts';

/**
 * One-off / admin helper to send a review-request email for testing.
 * Does NOT set review_email_sent_at (so production idempotency is preserved).
 * Call with service role Authorization header.
 */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  try {
    const supabase = getServiceSupabase();
    const body = await req.json().catch(() => ({}));
    const to = String(body.to || '').trim().toLowerCase();
    const orderId = body.orderId ? String(body.orderId).trim() : null;
    const orderNumber = body.orderNumber ? String(body.orderNumber).trim() : null;

    if (!to || !to.includes('@')) {
      return jsonResponse({ error: 'Valid "to" email is required.' }, 400);
    }

    let query = supabase
      .from('orders')
      .select('id, order_number, email, billing_name, status, review_token')
      .eq('status', 'paid');

    if (orderId) query = query.eq('id', orderId);
    else if (orderNumber) query = query.eq('order_number', orderNumber);
    else query = query.eq('email', to).order('paid_at', { ascending: false }).limit(1);

    const { data: order, error: orderError } = await query.maybeSingle();
    if (orderError) throw orderError;
    if (!order) {
      return jsonResponse({ error: 'No paid order found for this request.' }, 404);
    }

    let reviewToken = order.review_token as string | null;
    if (!reviewToken) {
      const { data: updated, error: tokenError } = await supabase
        .from('orders')
        .update({ review_token: crypto.randomUUID() })
        .eq('id', order.id)
        .select('review_token')
        .single();
      if (tokenError) throw tokenError;
      reviewToken = updated.review_token;
    }

    const items = await fetchOrderItems(supabase, order.id);
    const productNames = items.map((item) => item.product_name).filter(Boolean);

    const result = await sendReviewRequestEmail(
      {
        order_number: order.order_number,
        email: to,
        billing_name: order.billing_name,
        review_token: reviewToken!,
      },
      productNames,
    );

    if (!result.sent) {
      return jsonResponse({ error: 'Email not sent', reason: result.reason }, 502);
    }

    const siteUrl = Deno.env.get('SITE_URL') || 'https://thelilylettersco.com';
    const reviewUrl = `${siteUrl.replace(/\/$/, '')}/review/${reviewToken}`;

    return jsonResponse({
      ok: true,
      to,
      orderNumber: order.order_number,
      reviewUrl,
      productNames,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to send test review email.';
    return jsonResponse({ error: message }, 500);
  }
});
