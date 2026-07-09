export type CartLineItem = {
  productId: number;
  priceCents: number;
};

export type CouponRow = {
  id: string;
  code: string;
  discount_type: 'percent' | 'fixed';
  discount_value: number;
  scope: 'cart' | 'products';
  min_subtotal_cents: number | null;
  max_redemptions: number | null;
  times_redeemed: number;
  starts_at: string | null;
  ends_at: string | null;
  active: boolean;
};

export function normalizeCouponCode(code: string) {
  return String(code || '').trim().toUpperCase();
}

export function calculateDiscountCents(
  coupon: CouponRow,
  items: CartLineItem[],
  eligibleProductIds: Set<number> | null,
) {
  const grossSubtotalCents = items.reduce((sum, item) => sum + item.priceCents, 0);

  let eligibleSubtotalCents: number;
  if (coupon.scope === 'cart') {
    eligibleSubtotalCents = grossSubtotalCents;
  } else {
    const eligibleSet = eligibleProductIds || new Set<number>();
    eligibleSubtotalCents = items
      .filter((item) => eligibleSet.has(item.productId))
      .reduce((sum, item) => sum + item.priceCents, 0);
  }

  if (eligibleSubtotalCents <= 0) {
    return { discountCents: 0, grossSubtotalCents, eligibleSubtotalCents };
  }

  let discountCents: number;
  if (coupon.discount_type === 'percent') {
    discountCents = Math.round(eligibleSubtotalCents * Number(coupon.discount_value) / 100);
  } else {
    discountCents = Math.min(Math.round(Number(coupon.discount_value) * 100), eligibleSubtotalCents);
  }

  discountCents = Math.min(discountCents, eligibleSubtotalCents);

  return { discountCents, grossSubtotalCents, eligibleSubtotalCents };
}

export function validateCouponApplicability(
  coupon: CouponRow | null,
  items: CartLineItem[],
  eligibleProductIds: Set<number> | null,
): string | null {
  if (!coupon) return 'Invalid coupon code.';
  if (!coupon.active) return 'This coupon is no longer active.';

  const now = new Date();
  if (coupon.starts_at && new Date(coupon.starts_at) > now) {
    return 'This coupon is not active yet.';
  }
  if (coupon.ends_at && new Date(coupon.ends_at) < now) {
    return 'This coupon has expired.';
  }
  if (coupon.max_redemptions != null && coupon.times_redeemed >= coupon.max_redemptions) {
    return 'This coupon has reached its usage limit.';
  }

  const { discountCents, grossSubtotalCents, eligibleSubtotalCents } = calculateDiscountCents(
    coupon,
    items,
    eligibleProductIds,
  );

  if (coupon.min_subtotal_cents != null && grossSubtotalCents < coupon.min_subtotal_cents) {
    const min = (coupon.min_subtotal_cents / 100).toFixed(2);
    return `Minimum order of $${min} required.`;
  }

  if (coupon.scope === 'products' && eligibleSubtotalCents <= 0) {
    return 'This coupon does not apply to items in your cart.';
  }

  if (discountCents <= 0) {
    return 'This coupon does not apply to your order.';
  }

  return null;
}

export async function loadCouponWithProducts(
  supabase: { from: (table: string) => ReturnType<ReturnType<typeof import('https://esm.sh/@supabase/supabase-js@2').createClient>['from']> },
  code: string,
) {
  const normalized = normalizeCouponCode(code);
  if (!normalized) return { coupon: null, eligibleProductIds: null };

  const { data: coupon, error } = await supabase
    .from('coupons')
    .select('*')
    .ilike('code', normalized)
    .maybeSingle();

  if (error) throw error;
  if (!coupon) return { coupon: null, eligibleProductIds: null };

  if (coupon.scope === 'products') {
    const { data: links, error: linksError } = await supabase
      .from('coupon_products')
      .select('product_id')
      .eq('coupon_id', coupon.id);
    if (linksError) throw linksError;
    const eligibleProductIds = new Set((links || []).map((l: { product_id: number }) => l.product_id));
    return { coupon: coupon as CouponRow, eligibleProductIds };
  }

  return { coupon: coupon as CouponRow, eligibleProductIds: null };
}
