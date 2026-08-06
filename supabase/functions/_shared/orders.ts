import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@17.7.0?target=deno';
import { sendOrderConfirmationEmail, sendReviewRequestEmail } from './orderEmail.ts';
import { normalizeCouponCode } from './coupons.ts';

const SIGNED_URL_TTL = 3600;

export function getServiceSupabase() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  return createClient(supabaseUrl, serviceKey);
}

export function generateOrderNumber() {
  return `TLLC-${Date.now().toString(36).toUpperCase()}`;
}

export async function signedPdfUrl(
  supabase: SupabaseClient,
  path: string | null,
  expiresIn = SIGNED_URL_TTL,
): Promise<string | null> {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  const { data, error } = await supabase.storage
    .from('product-downloads')
    .createSignedUrl(path, expiresIn);
  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}

export type OrderItemRow = {
  product_id: number;
  product_name: string;
  product_slug: string | null;
  price_cents: number;
  canva_link: string | null;
  pdf_url: string | null;
  pdf_file_name: string | null;
};

export async function enrichOrderItemsWithProductPdfNames(
  supabase: SupabaseClient,
  orderItems: OrderItemRow[],
): Promise<OrderItemRow[]> {
  const missingProductIds = [
    ...new Set(
      orderItems
        .filter((item) => !item.pdf_file_name?.trim() && item.product_id)
        .map((item) => item.product_id),
    ),
  ];

  if (!missingProductIds.length) return orderItems;

  const { data: products, error } = await supabase
    .from('products')
    .select('id, pdf_file_name')
    .in('id', missingProductIds);

  if (error) throw error;

  const nameByProductId = new Map(
    (products || []).map((product) => [product.id, product.pdf_file_name as string | null]),
  );

  return orderItems.map((item) => ({
    ...item,
    pdf_file_name: item.pdf_file_name?.trim()
      ? item.pdf_file_name
      : nameByProductId.get(item.product_id) || null,
  }));
}

export async function buildOrderItemsResponse(
  supabase: SupabaseClient,
  orderItems: OrderItemRow[],
) {
  const enrichedItems = await enrichOrderItemsWithProductPdfNames(supabase, orderItems);

  return Promise.all(
    enrichedItems.map(async (item) => ({
      product_id: item.product_id,
      product_name: item.product_name,
      product_slug: item.product_slug,
      price_cents: item.price_cents,
      pdf_url: item.pdf_url,
      pdf_file_name: item.pdf_file_name,
      pdf_signed_url: await signedPdfUrl(supabase, item.pdf_url),
      canva_link: item.canva_link,
    })),
  );
}

export function validatePaymentIntent(
  paymentIntent: Stripe.PaymentIntent,
  order: { order_number: string; subtotal_cents: number; currency?: string },
) {
  if (paymentIntent.status !== 'succeeded') {
    throw new Error('Payment has not succeeded yet.');
  }
  if (paymentIntent.metadata?.order_number !== order.order_number) {
    throw new Error('Payment does not match this order.');
  }
  if (paymentIntent.amount !== order.subtotal_cents) {
    throw new Error('Payment amount does not match order total.');
  }
  if (
    order.currency &&
    paymentIntent.currency.toLowerCase() !== order.currency.toLowerCase()
  ) {
    throw new Error('Payment currency does not match order currency.');
  }
}

export async function incrementCouponRedemption(
  supabase: SupabaseClient,
  couponCode: string,
) {
  const normalized = normalizeCouponCode(couponCode);
  if (!normalized) return;

  const { data: coupon } = await supabase
    .from('coupons')
    .select('id, times_redeemed, max_redemptions')
    .ilike('code', normalized)
    .maybeSingle();

  if (!coupon) return;
  if (coupon.max_redemptions != null && coupon.times_redeemed >= coupon.max_redemptions) return;

  await supabase
    .from('coupons')
    .update({
      times_redeemed: (coupon.times_redeemed || 0) + 1,
      updated_at: new Date().toISOString(),
    })
    .eq('id', coupon.id);
}

export async function markOrderPaid(
  supabase: SupabaseClient,
  orderId: string,
  paymentIntent: Stripe.PaymentIntent,
) {
  const now = new Date();
  const chargeId =
    typeof paymentIntent.latest_charge === 'string'
      ? paymentIntent.latest_charge
      : paymentIntent.latest_charge?.id ?? null;

  const { data: existing } = await supabase
    .from('orders')
    .select('status, coupon_code')
    .eq('id', orderId)
    .maybeSingle();

  if (existing?.status === 'paid') {
    const { data: paidOrder } = await supabase
      .from('orders')
      .select('id, order_number, email, status, subtotal_cents, currency, paid_at, billing_name')
      .eq('id', orderId)
      .single();
    return paidOrder;
  }

  const { data, error } = await supabase
    .from('orders')
    .update({
      status: 'paid',
      paid_at: now.toISOString(),
      stripe_payment_intent_id: paymentIntent.id,
      stripe_charge_id: chargeId,
      payment_provider: 'stripe',
      updated_at: now.toISOString(),
    })
    .eq('id', orderId)
    .neq('status', 'refunded')
    .neq('status', 'paid')
    .select('id, order_number, email, status, subtotal_cents, currency, paid_at, billing_name, coupon_code')
    .single();

  if (error) throw error;

  if (data?.coupon_code) {
    await incrementCouponRedemption(supabase, data.coupon_code);
  }

  return data;
}

export async function fetchOrderItems(supabase: SupabaseClient, orderId: string) {
  const { data, error } = await supabase
    .from('order_items')
    .select(
      'id, product_id, product_name, product_slug, price_cents, canva_link, pdf_url, pdf_file_name',
    )
    .eq('order_id', orderId);

  if (error) throw error;
  return (data || []) as (OrderItemRow & { id: string })[];
}

export async function sendOrderConfirmationEmailIfNeeded(
  supabase: SupabaseClient,
  orderId: string,
) {
  const { data: claimed, error: claimError } = await supabase
    .from('orders')
    .update({ confirmation_email_sent_at: new Date().toISOString() })
    .eq('id', orderId)
    .eq('status', 'paid')
    .is('confirmation_email_sent_at', null)
    .select('id, order_number, email, billing_name')
    .maybeSingle();

  if (claimError) throw claimError;
  if (!claimed) return { sent: false, reason: 'already_sent' as const };

  try {
    const items = await enrichOrderItemsWithProductPdfNames(
      supabase,
      await fetchOrderItems(supabase, orderId),
    );
    const result = await sendOrderConfirmationEmail(supabase, claimed, items);

    if (!result.sent) {
      await supabase
        .from('orders')
        .update({ confirmation_email_sent_at: null })
        .eq('id', orderId);
    }

    return result;
  } catch (error) {
    await supabase
      .from('orders')
      .update({ confirmation_email_sent_at: null })
      .eq('id', orderId);
    throw error;
  }
}

export async function sendReviewRequestEmailIfNeeded(
  supabase: SupabaseClient,
  orderId: string,
) {
  // Ensure a review token exists before claiming the send
  const { data: existing, error: existingError } = await supabase
    .from('orders')
    .select('id, review_token, review_email_sent_at, status')
    .eq('id', orderId)
    .maybeSingle();

  if (existingError) throw existingError;
  if (!existing || existing.status !== 'paid') {
    return { sent: false, reason: 'not_eligible' as const };
  }
  if (existing.review_email_sent_at) {
    return { sent: false, reason: 'already_sent' as const };
  }

  let reviewToken = existing.review_token as string | null;
  if (!reviewToken) {
    const { data: withToken, error: tokenError } = await supabase
      .from('orders')
      .update({ review_token: crypto.randomUUID() })
      .eq('id', orderId)
      .is('review_token', null)
      .select('review_token')
      .maybeSingle();
    if (tokenError) throw tokenError;
    reviewToken = withToken?.review_token ?? null;
    if (!reviewToken) {
      const { data: refreshed } = await supabase
        .from('orders')
        .select('review_token')
        .eq('id', orderId)
        .maybeSingle();
      reviewToken = refreshed?.review_token ?? null;
    }
  }

  if (!reviewToken) {
    return { sent: false, reason: 'missing_token' as const };
  }

  const { data: claimed, error: claimError } = await supabase
    .from('orders')
    .update({ review_email_sent_at: new Date().toISOString() })
    .eq('id', orderId)
    .eq('status', 'paid')
    .is('review_email_sent_at', null)
    .select('id, order_number, email, billing_name, review_token')
    .maybeSingle();

  if (claimError) throw claimError;
  if (!claimed) return { sent: false, reason: 'already_sent' as const };

  try {
    const items = await fetchOrderItems(supabase, orderId);
    const productNames = items.map((item) => item.product_name).filter(Boolean);
    const result = await sendReviewRequestEmail(
      {
        order_number: claimed.order_number,
        email: claimed.email,
        billing_name: claimed.billing_name,
        review_token: claimed.review_token || reviewToken,
      },
      productNames,
    );

    if (!result.sent) {
      await supabase
        .from('orders')
        .update({ review_email_sent_at: null })
        .eq('id', orderId);
    }

    return result;
  } catch (error) {
    await supabase
      .from('orders')
      .update({ review_email_sent_at: null })
      .eq('id', orderId);
    throw error;
  }
}
