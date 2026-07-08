# Stripe Payment Integration

Checkout uses **Stripe Payment Element** with Supabase Edge Functions. Card data never touches your server.

## Flow

1. Customer completes contact + billing on `/checkout`
2. `create-order` validates cart prices, creates `orders` row (`status: pending`), creates Stripe PaymentIntent in **USD**
3. Payment Element confirms payment in the browser
4. If Stripe returns `currency_not_supported` (Brazilian cards that require BRL), the checkout:
   - calls `retry-order-brl` (preview) to convert USD→BRL using a live external FX rate
   - shows a confirmation modal with the BRL amount
   - on accept, `retry-order-brl` (confirm) creates a new PaymentIntent in **BRL** and retries with the same card
5. `complete-order-payment` verifies the PaymentIntent and marks the order `paid`
6. `stripe-webhook` keeps order status in sync (`succeeded`, `failed`, `refunded`)
7. On `paid`, an SMTP confirmation email with PDF attachment(s) is sent to the customer
8. `/order-confirmation` loads the paid order via `get-order-confirmation` and enables PDF downloads

## Edge Functions

| Function | Purpose |
|----------|---------|
| `create-order` | Pending order + PaymentIntent (`clientSecret`) in USD |
| `retry-order-brl` | Preview/confirm BRL retry after `currency_not_supported` |
| `complete-order-payment` | Verify PI succeeded → `paid` + signed PDF URLs |
| `get-order-confirmation` | Load confirmation page data (guest: order number + email) |
| `stripe-webhook` | Async status updates from Stripe |

Deploy:

```bash
supabase functions deploy create-order
supabase functions deploy retry-order-brl
supabase functions deploy complete-order-payment
supabase functions deploy get-order-confirmation
supabase functions deploy stripe-webhook
```

## BRL retry (Brazilian cards)

When a Brazilian card is charged in USD, Stripe may decline with:

- `decline_code: currency_not_supported`
- message: *"Your card is not supported for this currency. You can only charge Brazilian cards in BRL in Brazil."*

The system then:

1. Keeps the order `pending` (webhook ignores this decline code)
2. Fetches a live USD→BRL rate from a free FX API (`open.er-api.com`, no key) and applies an optional safety margin
3. Shows the customer a confirmation modal with the BRL total
4. On accept, re-validates the rate (re-quotes if it drifted more than 2%) and creates a new PaymentIntent in `brl`
5. Retries payment with `confirmCardPayment` using the same payment method

Since the Stripe account settles in **BRL**, charging in BRL involves no Stripe FX conversion — the external rate only converts the USD catalog price into the BRL amount to charge.

> Note: Stripe's FX Quotes API is **not available for Brazil-based accounts**, which is why the rate is sourced externally.

Orders store audit fields: `original_subtotal_cents`, `original_currency`.

**Optional secrets:**
- `USD_BRL_MARGIN_PERCENT` — safety margin added to the live rate (default `0`)
- `FX_RATE_API_URL` — override the FX rate endpoint (default `https://open.er-api.com/v6/latest/USD`)

## Secrets (Supabase Dashboard → Edge Functions → Secrets)

| Secret | Description |
|--------|-------------|
| `STRIPE_SECRET_KEY` | Stripe secret key (`sk_test_...` or `sk_live_...`) |
| `STRIPE_WEBHOOK_SECRET` | Webhook signing secret (`whsec_...`) |
| `SITE_URL` | `https://thelilylettersco.com` (3DS return URL base) |
| `SMTP_HOST` | `smtp.hostinger.com` |
| `SMTP_PORT` | `465` (TLS/SSL) |
| `SMTP_USER` | `no-reply@thelilylettersco.com` |
| `SMTP_PASSWORD` | Mailbox password for the sender account |
| `ORDER_FROM_EMAIL` | `The Lily Letters Co. <no-reply@thelilylettersco.com>` |

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
