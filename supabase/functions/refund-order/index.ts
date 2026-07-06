import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, jsonResponse } from '../_shared/cors.ts';
import { getStripe } from '../_shared/stripe.ts';
import { getServiceSupabase } from '../_shared/orders.ts';

async function requireAdmin(req: Request) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return { error: jsonResponse({ error: 'Unauthorized' }, 401) };
  }

  const userClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } },
  );

  const { data: isAdmin, error: adminError } = await userClient.rpc('is_admin');
  if (adminError || !isAdmin) {
    return { error: jsonResponse({ error: 'Forbidden' }, 403) };
  }

  return { ok: true };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  try {
    const auth = await requireAdmin(req);
    if (auth.error) return auth.error;

    const body = await req.json();
    const orderId = String(body.orderId || '').trim();
    if (!orderId) {
      return jsonResponse({ error: 'Order ID is required' }, 400);
    }

    const supabase = getServiceSupabase();
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, order_number, status, stripe_payment_intent_id, subtotal_cents')
      .eq('id', orderId)
      .maybeSingle();

    if (orderError) throw orderError;
    if (!order) {
      return jsonResponse({ error: 'Order not found' }, 404);
    }
    if (order.status !== 'paid') {
      return jsonResponse({ error: 'Only paid orders can be refunded' }, 400);
    }
    if (!order.stripe_payment_intent_id) {
      return jsonResponse({ error: 'Order has no Stripe payment' }, 400);
    }

    const stripe = getStripe();
    await stripe.refunds.create({
      payment_intent: order.stripe_payment_intent_id,
    });

    const now = new Date().toISOString();
    const { data: updated, error: updateError } = await supabase
      .from('orders')
      .update({
        status: 'refunded',
        updated_at: now,
      })
      .eq('id', orderId)
      .select(
        'id, order_number, email, status, subtotal_cents, currency, paid_at, stripe_payment_intent_id, stripe_charge_id, updated_at',
      )
      .single();

    if (updateError) throw updateError;

    return jsonResponse({ order: updated });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Refund failed';
    return jsonResponse({ error: message }, 500);
  }
});
