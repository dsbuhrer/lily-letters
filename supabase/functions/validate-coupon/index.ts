import { corsHeaders, jsonResponse } from '../_shared/cors.ts';
import {
  calculateDiscountCents,
  loadCouponWithProducts,
  normalizeCouponCode,
  validateCouponApplicability,
} from '../_shared/coupons.ts';
import { getServiceSupabase } from '../_shared/orders.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  try {
    const supabase = getServiceSupabase();
    const body = await req.json();
    const code = normalizeCouponCode(body.code);
    const items = body.items;

    if (!code) {
      return jsonResponse({ valid: false, error: 'Enter a coupon code.' });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return jsonResponse({ valid: false, error: 'Cart is empty.' });
    }

    const productIds = items.map((item: { productId: number }) => item.productId);
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, price, active')
      .in('id', productIds);

    if (productsError) throw productsError;

    const productMap = new Map((products || []).map((p) => [p.id, p]));
    const cartLines: Array<{ productId: number; priceCents: number }> = [];

    for (const item of items) {
      const product = productMap.get(item.productId);
      if (!product || !product.active) {
        return jsonResponse(
          { valid: false, error: `Product ${item.productId} is not available.` },
        );
      }
      cartLines.push({
        productId: item.productId,
        priceCents: Math.round(Number(product.price) * 100),
      });
    }

    const { coupon, eligibleProductIds } = await loadCouponWithProducts(supabase, code);
    const validationError = validateCouponApplicability(coupon, cartLines, eligibleProductIds);
    if (validationError) {
      return jsonResponse({ valid: false, error: validationError });
    }

    const { discountCents, grossSubtotalCents, eligibleSubtotalCents } = calculateDiscountCents(
      coupon!,
      cartLines,
      eligibleProductIds,
    );

    return jsonResponse({
      valid: true,
      code: coupon!.code,
      discountCents,
      grossSubtotalCents,
      eligibleSubtotalCents,
      totalCents: grossSubtotalCents - discountCents,
      discountAmount: discountCents / 100,
      grossSubtotal: grossSubtotalCents / 100,
      total: (grossSubtotalCents - discountCents) / 100,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to validate coupon';
    return jsonResponse({ valid: false, error: message }, 500);
  }
});
