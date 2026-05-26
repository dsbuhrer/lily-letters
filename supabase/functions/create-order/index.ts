import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, jsonResponse } from '../_shared/cors.ts';

function generateOrderNumber() {
  return `TLLC-${Date.now().toString(36).toUpperCase()}`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const mockCheckout = Deno.env.get('MOCK_CHECKOUT') !== 'false';

    const supabase = createClient(supabaseUrl, serviceKey);

    const body = await req.json();
    const email = String(body.email || '').toLowerCase().trim();
    const firstName = String(body.firstName || '').trim();
    const lastName = String(body.lastName || '').trim();
    const items = body.items;
    const billing = body.billing || {};
    const userId = body.userId || null;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return jsonResponse({ error: 'Invalid email' }, 400);
    }
    if (!firstName) {
      return jsonResponse({ error: 'First name is required' }, 400);
    }
    if (!Array.isArray(items) || items.length === 0) {
      return jsonResponse({ error: 'Cart is empty' }, 400);
    }

    const productIds = items.map((i: { productId: number }) => i.productId);
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, slug, canva_link, price, active')
      .in('id', productIds);

    if (productsError) throw productsError;

    const productMap = new Map((products || []).map((p) => [p.id, p]));

    let subtotalCents = 0;
    const orderItems: Array<{
      product_id: number;
      product_name: string;
      product_slug: string | null;
      price_cents: number;
      canva_link: string | null;
    }> = [];

    for (const item of items) {
      const product = productMap.get(item.productId);
      if (!product || !product.active) {
        return jsonResponse({ error: `Product ${item.productId} is not available` }, 400);
      }
      const priceCents = Math.round(Number(product.price) * 100);
      subtotalCents += priceCents;
      orderItems.push({
        product_id: item.productId,
        product_name: item.name || product.slug,
        product_slug: item.slug || product.slug || null,
        price_cents: priceCents,
        canva_link: product.canva_link || null,
      });
    }

    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    const orderNumber = generateOrderNumber();
    const billingName = [firstName, lastName].filter(Boolean).join(' ').trim();

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        email,
        user_id: userId,
        status: mockCheckout ? 'paid' : 'pending',
        subtotal_cents: subtotalCents,
        currency: 'USD',
        payment_provider: mockCheckout ? 'mock' : 'payoneer',
        paid_at: mockCheckout ? now.toISOString() : null,
        download_expires_at: mockCheckout ? expiresAt.toISOString() : null,
        billing_name: billingName || firstName,
        billing_address: billing,
      })
      .select('id, order_number')
      .single();

    if (orderError) throw orderError;

    const rows = orderItems.map((item) => ({
      order_id: order.id,
      ...item,
    }));

    const { error: itemsError } = await supabase.from('order_items').insert(rows);
    if (itemsError) throw itemsError;

    return jsonResponse({ orderId: order.order_number, id: order.id }, 201);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to create order';
    return jsonResponse({ error: message }, 500);
  }
});
