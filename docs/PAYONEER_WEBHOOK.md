# Payoneer Webhook Integration (Future)

This document defines the contract between Payoneer payment events and the Lily Letters order system. Implement when Payoneer checkout is ready.

## Overview

Today, mock checkout persists orders via `POST /api/orders` with `payment_provider: 'mock'` and `status: 'paid'`. Payoneer will replace this flow:

1. Checkout creates an order with `status: 'pending'`
2. User completes payment on Payoneer
3. Payoneer sends webhook to Express
4. Webhook updates order to `status: 'paid'` and sets download expiry

## Endpoint (to implement)

```
POST /api/webhooks/payoneer
```

- Verify Payoneer signature (HMAC or documented auth header)
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

## Idempotent upsert pattern

```javascript
// Pseudocode — server/routes/webhooks/payoneer.js
const paymentId = payload.transaction_id;

const { data: existing } = await supabase
  .from('orders')
  .select('id, status')
  .eq('payoneer_payment_id', paymentId)
  .maybeSingle();

if (existing?.status === 'paid') {
  return res.status(200).json({ ok: true, duplicate: true });
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

Or call the existing `claim_orders_by_email()` logic server-side when user later signs up.

## Checkout flow changes

Replace mock `POST /api/orders` paid insert with:

1. Create order `status: 'pending'`, store Payoneer session/reference
2. Redirect user to Payoneer hosted checkout
3. On return URL, show "processing" state until webhook confirms

## Environment variables (future)

```env
PAYONEER_API_KEY=
PAYONEER_WEBHOOK_SECRET=
PAYONEER_MERCHANT_ID=
```

## Security

- Never expose Payoneer secrets to the browser
- Webhook route uses `service_role` Supabase client only
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
- Mock orders API: [`server/routes/orders.js`](../server/routes/orders.js)
- Customer panel: [`src/pages/account/`](../src/pages/account/)
