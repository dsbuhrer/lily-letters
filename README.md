# Lily Letters Co.

Wedding stationery shop with editorial blog, Supabase CMS, and SEO-ready static pre-render for Apache/cPanel hosting.

## Features

- Product catalog (Supabase + static fallback)
- Cart, wishlist, checkout via Edge Function
- **Blog** with pre-rendered HTML (`/blog/*`) — meta tags, JSON-LD, FAQ schema
- **CMS** at `/admin` — Supabase Auth + `staff_roles`, posts (Tiptap), products, subscribers
- Newsletter signup → PostgreSQL
- `sitemap.xml`, `rss.xml`, `robots.txt`, `llms.txt` generated at build time

## Requirements

- Node.js 18+
- [Supabase](https://supabase.com) project (PostgreSQL, Auth, Storage, Edge Functions)
- [Supabase CLI](https://supabase.com/docs/guides/cli) recommended for migrations and function deploy

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy environment variables:

```bash
cp .env.example .env
```

Fill in `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_SITE_URL`, `VITE_STRIPE_PUBLISHABLE_KEY`, `SITE_URL`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD`.

Enable **Email** auth in Supabase Dashboard → Authentication → Providers. Under **URL Configuration**, set **Site URL** to your production domain (e.g. `https://thelilylettersco.com`) and add these **Redirect URLs**:

- `https://thelilylettersco.com/account`
- `https://thelilylettersco.com/account/reset-password`
- `http://127.0.0.1:5173/account` (local dev)
- `http://127.0.0.1:5173/account/reset-password` (local dev)

3. Apply database migrations:

```bash
supabase db push
# or run SQL files in supabase/migrations/ manually
```

4. Seed categories, products, blog posts, and admin user:

```bash
npm run seed
```

This creates a Supabase Auth user (`ADMIN_EMAIL` / `ADMIN_PASSWORD`) and a row in `staff_roles` with role `admin`.

5. Deploy Edge Functions (checkout, Stripe, SEO, auto-deploy):

```bash
supabase functions deploy create-order
supabase functions deploy complete-order-payment
supabase functions deploy get-order-confirmation
supabase functions deploy stripe-webhook
supabase functions deploy generate-post-seo
supabase functions deploy trigger-rebuild
```

Set secrets in Supabase Dashboard → Edge Functions → Secrets: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `SITE_URL`, and optionally `GEMINI_API_KEY`. See [`docs/STRIPE.md`](docs/STRIPE.md) for Stripe webhook setup.

**Auto-deploy on blog publish/edit:** configure GitHub Actions + Database Webhook — see [`docs/AUTO_DEPLOY.md`](docs/AUTO_DEPLOY.md).

6. Development (Vite only):

```bash
npm run dev
```

- Store & CMS: http://localhost:5173

## Production build & cPanel deploy

```bash
npm run build
```

This runs `vite build` then `scripts/prerender.mjs`, which needs `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `SITE_URL` in `.env` (build machine only — never commit service role to the client).

Upload the entire **`dist/`** folder to `public_html` on cPanel, or use **automatic FTP deploy** when a post is published or edited (see [`docs/AUTO_DEPLOY.md`](docs/AUTO_DEPLOY.md)).

The included `.htaccess` serves pre-rendered blog/product pages when those files exist and falls back to SPA routing otherwise.

### Build-time vs runtime env

| Variable | Where |
|----------|--------|
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_STRIPE_PUBLISHABLE_KEY`, `VITE_SITE_URL` | Embedded in JS at **build** — required for login, checkout, and data |
| `SUPABASE_SERVICE_ROLE_KEY` | **Build only** (prerender + seed), never in browser |
| Edge Function secrets | Supabase Dashboard |

## CMS

| URL | Purpose |
|-----|---------|
| `/admin/login` | Admin login (Supabase Auth) |
| `/admin` | Dashboard |
| `/admin/posts` | Blog posts |
| `/admin/products` | Shop products |
| `/admin/subscribers` | Newsletter emails + CSV export (browser) |

Admin access requires a user in `staff_roles` with `role = 'admin'`. Create manually in SQL if needed:

```sql
INSERT INTO staff_roles (user_id, role)
VALUES ('<auth.users uuid>', 'admin');
```

## Customer account

| URL | Purpose |
|-----|---------|
| `/account/login` | Sign in |
| `/account/register` | Create account |
| `/account/confirm-email` | Pending email confirmation (resend link) |
| `/account` | Dashboard — recent orders & quick download |
| `/account/orders` | Purchase history |
| `/account/settings` | Edit profile & password reset |

Orders are stored in Supabase (`orders`, `order_items`, `profiles`). Guest orders link to an account only after **email confirmation** (app + `claim_orders_by_email` RPC). In production, enable **Confirm email** under Supabase Dashboard → Authentication → Email.

Stripe checkout is documented in [`docs/STRIPE.md`](docs/STRIPE.md).

## Stack

- **Frontend:** React 18, Vite 5, React Router, Tailwind, Zustand, Tiptap (admin)
- **Backend:** Supabase (Postgres + RLS, Auth, Storage, Edge Functions)
- **SEO:** Build-time pre-render (`scripts/prerender.mjs`)

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Vite dev server |
| `npm run build` | Vite build + SEO pre-render |
| `npm run build:seo` | Re-run pre-render only (needs existing `dist/`) |
| `npm run seed` | Seed database + admin auth |
| `npm run preview` | Preview production build locally |
