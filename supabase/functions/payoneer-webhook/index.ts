import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, jsonResponse } from '../_shared/cors.ts';

/**
 * Payoneer webhook stub — verify signature and update order when payment completes.
 * Set PAYONEER_WEBHOOK_SECRET in Supabase Edge Function secrets before going live.
 */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const secret = Deno.env.get('PAYONEER_WEBHOOK_SECRET');
  if (!secret) {
    return jsonResponse({ error: 'Webhook not configured' }, 503);
  }

  // TODO: verify Payoneer signature from headers when integration is ready
  const payload = await req.json();
  const paymentId = payload?.payment_id || payload?.payoneer_payment_id;
  const orderNumber = payload?.order_number || payload?.merchant_reference;

  if (!paymentId || !orderNumber) {
    return jsonResponse({ error: 'Invalid payload' }, 400);
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const now = new Date();
  const expiresAt = new Date(now);
  expiresAt.setFullYear(expiresAt.getFullYear() + 1);

  const { data: existing } = await supabase
    .from('orders')
    .select('id, status')
    .eq('payoneer_payment_id', paymentId)
    .maybeSingle();

  if (existing?.status === 'paid') {
    return jsonResponse({ ok: true, idempotent: true });
  }

  const { error } = await supabase
    .from('orders')
    .update({
      status: 'paid',
      payoneer_payment_id: paymentId,
      payoneer_status: payload?.status || 'completed',
      payment_provider: 'payoneer',
      paid_at: now.toISOString(),
      download_expires_at: expiresAt.toISOString(),
      updated_at: now.toISOString(),
    })
    .eq('order_number', orderNumber);

  if (error) {
    return jsonResponse({ error: error.message }, 500);
  }

  return jsonResponse({ ok: true });
});
