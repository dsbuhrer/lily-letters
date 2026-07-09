import { corsHeaders, jsonResponse } from '../_shared/cors.ts';
import {
  calculateDiscountCents,
  loadCouponWithProducts,
  normalizeCouponCode,
  validateCouponApplicability,
} from '../_shared/coupons.ts';
import { convertUsdToBrl } from '../_shared/fxQuotes.ts';
import { getStripe } from '../_shared/stripe.ts';
import { generateOrderNumber, getServiceSupabase } from '../_shared/orders.ts';

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
    const email = String(body.email || '').toLowerCase().trim();
    const firstName = String(body.firstName || '').trim();
    const lastName = String(body.lastName || '').trim();
    const items = body.items;
    const billing = body.billing || {};
    const userId = body.userId || null;
    const couponCode = normalizeCouponCode(body.couponCode || '');

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
      .select('id, slug, canva_link, pdf_url, pdf_file_name, price, active')
      .in('id', productIds);

    if (productsError) throw productsError;

    const productMap = new Map((products || []).map((p) => [p.id, p]));

    let grossSubtotalCents = 0;
    const orderItems: Array<{
      product_id: number;
      product_name: string;
      product_slug: string | null;
      price_cents: number;
      canva_link: string | null;
      pdf_url: string | null;
      pdf_file_name: string | null;
    }> = [];

    for (const item of items) {
      const product = productMap.get(item.productId);
      if (!product || !product.active) {
        return jsonResponse({ error: `Product ${item.productId} is not available` }, 400);
      }
      const priceCents = Math.round(Number(product.price) * 100);
      grossSubtotalCents += priceCents;
      orderItems.push({
        product_id: item.productId,
        product_name: item.name || product.slug,
        product_slug: item.slug || product.slug || null,
        price_cents: priceCents,
        canva_link: product.canva_link || null,
        pdf_url: product.pdf_url || null,
        pdf_file_name: product.pdf_file_name || null,
      });
    }

    let discountCents = 0;
    let appliedCouponCode: string | null = null;

    if (couponCode) {
      const cartLines = orderItems.map((item) => ({
        productId: item.product_id,
        priceCents: item.price_cents,
      }));
      const { coupon, eligibleProductIds } = await loadCouponWithProducts(supabase, couponCode);
      const validationError = validateCouponApplicability(coupon, cartLines, eligibleProductIds);
      if (validationError) {
        return jsonResponse({ error: validationError }, 400);
      }
      const discountResult = calculateDiscountCents(coupon!, cartLines, eligibleProductIds);
      discountCents = discountResult.discountCents;
      appliedCouponCode = coupon!.code;
    }

    const subtotalCents = Math.max(0, grossSubtotalCents - discountCents);

    const orderNumber = generateOrderNumber();
    const billingName = [firstName, lastName].filter(Boolean).join(' ').trim();

    // Brazilian cards can only be charged in BRL, so bill BR customers in BRL
    // from the start (the account settles in BRL — no Stripe FX conversion).
    const isBrazil = String(billing?.country || '').toUpperCase() === 'BR';
    let currency = 'USD';
    let chargeCents = subtotalCents;
    let originalSubtotalCents: number | null = null;
    let originalCurrency: string | null = null;

    if (isBrazil) {
      const conversion = await convertUsdToBrl(subtotalCents);
      currency = 'BRL';
      chargeCents = conversion.brlCents;
      originalSubtotalCents = subtotalCents;
      originalCurrency = 'USD';
    }

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        email,
        user_id: userId,
        status: 'pending',
        subtotal_cents: chargeCents,
        gross_subtotal_cents: grossSubtotalCents,
        discount_cents: discountCents,
        coupon_code: appliedCouponCode,
        currency,
        original_subtotal_cents: originalSubtotalCents,
        original_currency: originalCurrency,
        payment_provider: 'stripe',
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

    const paymentIntent = await stripe.paymentIntents.create({
      amount: chargeCents,
      currency: currency.toLowerCase(),
      payment_method_types: ['card'],
      receipt_email: email,
      description: `Order ${orderNumber} — Lilly Letters`,
      statement_descriptor_suffix: 'LILLY LETTERS',
      metadata: {
        order_id: order.id,
        order_number: orderNumber,
        ...(isBrazil
          ? { original_currency: 'USD', original_subtotal_cents: String(subtotalCents) }
          : {}),
      },
    });

    const { error: piUpdateError } = await supabase
      .from('orders')
      .update({ stripe_payment_intent_id: paymentIntent.id })
      .eq('id', order.id);

    if (piUpdateError) throw piUpdateError;

    if (!paymentIntent.client_secret) {
      throw new Error('Stripe did not return a client secret.');
    }

    return jsonResponse(
      {
        orderId: order.order_number,
        id: order.id,
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        currency,
        chargeAmount: chargeCents / 100,
        usdAmount: subtotalCents / 100,
        grossUsdAmount: grossSubtotalCents / 100,
        discountUsdAmount: discountCents / 100,
        couponCode: appliedCouponCode,
      },
      201,
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to create order';
    return jsonResponse({ error: message }, 500);
  }
});
