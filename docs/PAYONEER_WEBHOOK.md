# Payoneer Webhook Integration (Future)

This document defines the contract between Payoneer payment events and the Lily Letters order system. Implement when Payoneer checkout is ready.

## Overview

Today, mock checkout calls the Supabase Edge Function `create-order` with `payment_provider: 'mock'` and `status: 'paid'` when `MOCK_CHECKOUT` is not `false`. Payoneer will replace this flow:

1. Checkout invokes `create-order` with `status: 'pending'`
2. User completes payment on Payoneer
3. Payoneer sends webhook to the Edge Function
4. Webhook updates order to `status: 'paid'` and sets download expiry

## Endpoint

```
POST https://<project-ref>.supabase.co/functions/v1/payoneer-webhook
```

Implemented as a stub in [`supabase/functions/payoneer-webhook/`](../supabase/functions/payoneer-webhook/).

- Verify Payoneer signature (HMAC or documented auth header) using `PAYONEER_WEBHOOK_SECRET`
- Idempotent: use `payoneer_payment_id` as unique key
- Return `200` quickly; heavy work async if needed

## Database fields used

| Column | Purpose |
|--------|---------|
| `orders.payoneer_payment_id` | Unique Payoneer transaction ID (idempotency key) |
| `orders.payoneer_status` | Raw status from Payoneer payload |
| `orders.payment_provider` | Set to `'payoneer'` |
| `orders.status` | `pending` → `paid` / `failed` / `refunded` |
| `orders.paid_at` | Timestamp when payment confirmed |
| `orders.download_expires_at` | `paid_at + 1 year` |
| `orders.user_id` | Link if `auth.users` exists for `orders.email` |
| `order_items.canva_link` | Snapshot from `products.canva_link` at purchase time |

## Idempotent update pattern

```typescript
// supabase/functions/payoneer-webhook/index.ts
const paymentId = payload.transaction_id;

const { data: existing } = await supabase
  .from('orders')
  .select('id, status')
  .eq('payoneer_payment_id', paymentId)
  .maybeSingle();

if (existing?.status === 'paid') {
  return new Response(JSON.stringify({ ok: true, duplicate: true }), { status: 200 });
}

if (payload.event === 'payment.confirmed') {
  await supabase.from('orders').update({
    status: 'paid',
    payoneer_status: payload.status,
    paid_at: payload.paid_at,
    download_expires_at: addYears(payload.paid_at, 1),
    updated_at: new Date().toISOString(),
  }).eq('payoneer_payment_id', paymentId);
}
```

## Guest → account linking

After marking order paid, run:

```sql
UPDATE orders
SET user_id = (SELECT id FROM auth.users WHERE lower(email) = lower(orders.email))
WHERE payoneer_payment_id = $1 AND user_id IS NULL;
```

Or rely on `claim_orders_by_email()` when the user later signs up.

## Checkout flow changes

Replace mock `create-order` paid insert with:

1. Create order `status: 'pending'`, store Payoneer session/reference
2. Redirect user to Payoneer hosted checkout
3. On return URL, show "processing" state until webhook confirms

Set `MOCK_CHECKOUT=false` in Edge Function secrets when going live.

## Environment variables (Supabase secrets)

```env
PAYONEER_API_KEY=
PAYONEER_WEBHOOK_SECRET=
PAYONEER_MERCHANT_ID=
MOCK_CHECKOUT=false
```

## Security

- Never expose Payoneer secrets to the browser
- Webhook uses service role Supabase client only inside the Edge Function
- Validate webhook signature before any DB write
- Log failed verifications without leaking payload secrets

## Customer-facing states

| Order status | Account UI |
|--------------|------------|
| `pending` | Badge "Processing payment", downloads disabled |
| `paid` | Downloads enabled until `download_expires_at` |
| `failed` | Message to retry checkout or contact support |
| `refunded` | Downloads revoked, support link shown |

## Related files

- Schema: [`supabase/migrations/20260526000001_customer_accounts.sql`](../supabase/migrations/20260526000001_customer_accounts.sql)
- Checkout: [`supabase/functions/create-order/`](../supabase/functions/create-order/) + [`src/lib/supabase/orders.js`](../src/lib/supabase/orders.js)
- Customer panel: [`src/pages/account/`](../src/pages/account/)
