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
    if (!token || !UUID_RE.test(token)) {
      return jsonResponse({ error: 'Invalid review link.' }, 400);
    }

    const supabase = getServiceSupabase();
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, order_number, email, billing_name, status, review_token')
      .eq('review_token', token)
      .maybeSingle();

    if (orderError) throw orderError;
    if (!order || order.status !== 'paid') {
      return jsonResponse({ error: 'This review link is invalid or expired.' }, 404);
    }

    const { data: items, error: itemsError } = await supabase
      .from('order_items')
      .select('id, product_id, product_name, product_slug')
      .eq('order_id', order.id);

    if (itemsError) throw itemsError;

    const productIds = (items || [])
      .map((item) => item.product_id)
      .filter((id): id is number => id != null);

    let imageByProduct: Record<number, string | null> = {};
    if (productIds.length) {
      const { data: products } = await supabase
        .from('products')
        .select('id, images')
        .in('id', productIds);
      imageByProduct = Object.fromEntries(
        (products || []).map((p) => {
          const images = Array.isArray(p.images) ? p.images : [];
          return [p.id, images[0] || null];
        }),
      );
    }

    const { data: existingReviews, error: reviewsError } = await supabase
      .from('product_reviews')
      .select('id, product_id, rating, body, author_name, created_at')
      .eq('order_id', order.id);

    if (reviewsError) throw reviewsError;

    const reviewByProduct = Object.fromEntries(
      (existingReviews || []).map((r) => [r.product_id, r]),
    );

    // Deduplicate by product_id (keep first line item)
    const seen = new Set<number>();
    const products = [];
    for (const item of items || []) {
      if (item.product_id == null || seen.has(item.product_id)) continue;
      seen.add(item.product_id);
      const existing = reviewByProduct[item.product_id] || null;
      products.push({
        orderItemId: item.id,
        productId: item.product_id,
        name: item.product_name,
        slug: item.product_slug,
        image: imageByProduct[item.product_id] || null,
        reviewed: Boolean(existing),
        existingReview: existing
          ? {
              id: existing.id,
              rating: existing.rating,
              body: existing.body,
              authorName: existing.author_name,
              createdAt: existing.created_at,
            }
          : null,
      });
    }

    return jsonResponse({
      orderNumber: order.order_number,
      billingName: order.billing_name,
      email: order.email,
      products,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Could not load review invite.';
    return jsonResponse({ error: message }, 500);
  }
});
