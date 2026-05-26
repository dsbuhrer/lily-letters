import { Router } from 'express';
import { z } from 'zod';
import { requireSupabase } from '../lib/supabase.js';

const router = Router();

const createOrderSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1).max(100),
  lastName: z.string().max(100).optional(),
  items: z
    .array(
      z.object({
        productId: z.number().int().positive(),
        name: z.string().min(1),
        price: z.number().positive(),
        slug: z.string().optional(),
      }),
    )
    .min(1),
  billing: z
    .object({
      street: z.string().optional(),
      postalCode: z.string().optional(),
      city: z.string().optional(),
      stateProvince: z.string().optional(),
      country: z.string().optional(),
    })
    .optional(),
  userId: z.string().uuid().optional(),
});

function generateOrderNumber() {
  return `TLLC-${Date.now().toString(36).toUpperCase()}`;
}

/**
 * Mock checkout: persist order as paid until Payoneer webhook replaces this flow.
 */
router.post('/', async (req, res) => {
  try {
    const parsed = createOrderSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid order payload', details: parsed.error.flatten() });
    }

    const { email, firstName, lastName, items, billing, userId } = parsed.data;
    const supabase = requireSupabase();

    const productIds = items.map((i) => i.productId);
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, slug, canva_link')
      .in('id', productIds);

    if (productsError) throw productsError;

    const productMap = new Map((products || []).map((p) => [p.id, p]));

    const subtotalCents = Math.round(
      items.reduce((sum, item) => sum + item.price * 100, 0),
    );

    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    const orderNumber = generateOrderNumber();
    const billingName = [firstName, lastName].filter(Boolean).join(' ').trim();

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        email: email.toLowerCase(),
        user_id: userId || null,
        status: 'paid',
        subtotal_cents: subtotalCents,
        currency: 'USD',
        payment_provider: 'mock',
        paid_at: now.toISOString(),
        download_expires_at: expiresAt.toISOString(),
        billing_name: billingName || firstName,
        billing_address: billing || {},
      })
      .select('id, order_number')
      .single();

    if (orderError) throw orderError;

    const orderItems = items.map((item) => {
      const product = productMap.get(item.productId);
      return {
        order_id: order.id,
        product_id: item.productId,
        product_name: item.name,
        product_slug: item.slug || product?.slug || null,
        price_cents: Math.round(item.price * 100),
        canva_link: product?.canva_link || null,
      };
    });

    const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
    if (itemsError) throw itemsError;

    return res.status(201).json({
      orderId: order.order_number,
      id: order.id,
    });
  } catch (err) {
    console.error('POST /api/orders', err);
    return res.status(500).json({ error: err.message || 'Failed to create order' });
  }
});

export default router;
