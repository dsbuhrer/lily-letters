# Stripe Payment Integration

Checkout uses **Stripe Payment Element** with Supabase Edge Functions. Card data never touches your server.

## Flow

1. Customer completes contact + billing on `/checkout`
2. `create-order` validates cart prices, creates `orders` row (`status: pending`), creates Stripe PaymentIntent
3. Payment Element confirms payment in the browser
4. `complete-order-payment` verifies the PaymentIntent and marks the order `paid`
5. `stripe-webhook` keeps order status in sync (`succeeded`, `failed`, `refunded`)
6. `/order-confirmation` loads the paid order via `get-order-confirmation` and enables PDF downloads

## Edge Functions

| Function | Purpose |
|----------|---------|
| `create-order` | Pending order + PaymentIntent (`clientSecret`) |
| `complete-order-payment` | Verify PI succeeded → `paid` + signed PDF URLs |
| `get-order-confirmation` | Load confirmation page data (guest: order number + email) |
| `stripe-webhook` | Async status updates from Stripe |

Deploy:

```bash
supabase functions deploy create-order
supabase functions deploy complete-order-payment
supabase functions deploy get-order-confirmation
supabase functions deploy stripe-webhook
```

## Secrets (Supabase Dashboard → Edge Functions → Secrets)

| Secret | Description |
|--------|-------------|
| `STRIPE_SECRET_KEY` | Stripe secret key (`sk_test_...` or `sk_live_...`) |
| `STRIPE_WEBHOOK_SECRET` | Webhook signing secret (`whsec_...`) |
| `SITE_URL` | `https://thelilylettersco.com` (3DS return URL base) |

## Frontend env (`.env` / build)

| Variable | Description |
|----------|-------------|
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key (`pk_test_...`) |
| `VITE_SITE_URL` | `https://thelilylettersco.com` |

## Stripe Dashboard setup

1. **Developers → API keys** — copy publishable + secret keys (test mode first)
2. **Developers → Webhooks → Add endpoint**
   - URL: `https://<project-ref>.supabase.co/functions/v1/stripe-webhook`
   - Events: `payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.refunded`
3. Copy the webhook signing secret to `STRIPE_WEBHOOK_SECRET`
4. **Settings → Emails** — Stripe sends receipts (`receipt_email` on PaymentIntent)

## Test cards

| Card | Result |
|------|--------|
| `4242 4242 4242 4242` | Success |
| `4000 0000 0000 0002` | Declined |
| `4000 0025 0000 3155` | Requires 3DS authentication |

Use any future expiry, any CVC, any billing ZIP.

## Local webhook testing

```bash
stripe listen --forward-to http://127.0.0.1:54321/functions/v1/stripe-webhook
```

Use the `whsec_...` from the CLI as `STRIPE_WEBHOOK_SECRET` locally.

## Order statuses

| Status | Downloads |
|--------|-----------|
| `pending` | Blocked |
| `paid` | Enabled (no expiration) |
| `failed` | Blocked |
| `refunded` | Blocked — process refunds in Stripe Dashboard |

## Statement descriptor

Payments show **LILLY LETTERS** on the card statement (`statement_descriptor_suffix`).
