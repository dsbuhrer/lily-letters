import { corsHeaders, jsonResponse } from '../_shared/cors.ts';
import { getServiceSupabase } from '../_shared/orders.ts';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  try {
    const body = await req.json();
    const token = String(body.token || '').trim();
    const productId = Number(body.productId);
    const orderItemId = body.orderItemId ? String(body.orderItemId).trim() : null;
    const rating = Number(body.rating);
    const authorName = String(body.authorName || '').trim();
    const reviewBody = String(body.body || '').trim();

    if (!token || !UUID_RE.test(token)) {
      return jsonResponse({ error: 'Invalid review link.' }, 400);
    }
    if (!Number.isFinite(productId) || productId <= 0) {
      return jsonResponse({ error: 'Product is required.' }, 400);
    }
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return jsonResponse({ error: 'Please choose a rating from 1 to 5 stars.' }, 400);
    }
    if (!authorName) {
      return jsonResponse({ error: 'Please enter your name.' }, 400);
    }
    if (authorName.length > 120) {
      return jsonResponse({ error: 'Name must be 120 characters or fewer.' }, 400);
    }
    if (reviewBody.length > 2000) {
      return jsonResponse({ error: 'Review must be 2,000 characters or fewer.' }, 400);
    }

    const supabase = getServiceSupabase();
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, email, billing_name, status')
      .eq('review_token', token)
      .maybeSingle();

    if (orderError) throw orderError;
    if (!order || order.status !== 'paid') {
      return jsonResponse({ error: 'This review link is invalid or expired.' }, 404);
    }

    const { data: item, error: itemError } = await supabase
      .from('order_items')
      .select('id, product_id')
      .eq('order_id', order.id)
      .eq('product_id', productId)
      .limit(1)
      .maybeSingle();

    if (itemError) throw itemError;
    if (!item) {
      return jsonResponse({ error: 'This product was not part of your order.' }, 400);
    }

    const resolvedItemId = orderItemId || item.id;

    const { data: review, error: insertError } = await supabase
      .from('product_reviews')
      .insert({
        order_id: order.id,
        order_item_id: resolvedItemId,
        product_id: productId,
        rating,
        body: reviewBody || null,
        author_name: authorName,
        author_email: order.email,
      })
      .select('id, product_id, rating, body, author_name, created_at')
      .single();

    if (insertError) {
      if (insertError.code === '23505') {
        return jsonResponse({ error: 'You already reviewed this product.' }, 409);
      }
      throw insertError;
    }

    return jsonResponse({
      review: {
        id: review.id,
        productId: review.product_id,
        rating: review.rating,
        body: review.body,
        authorName: review.author_name,
        createdAt: review.created_at,
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Could not submit review.';
    return jsonResponse({ error: message }, 500);
  }
});
