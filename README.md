# Lily Letters Co.

Wedding stationery shop with editorial blog, custom CMS, and SEO/AEO-ready server rendering.

## Features

- Product catalog (API + static fallback)
- Cart, wishlist, checkout flow
- **Blog** with SSR (`/blog/*`) — meta tags, JSON-LD, FAQ schema
- **CMS** at `/admin` — posts (Tiptap), products, newsletter subscribers
- Newsletter signup (footer + blog) → PostgreSQL
- Dynamic `sitemap.xml`, `rss.xml`, `robots.txt`, `llms.txt`

## Requirements

- Node.js 18+
- [Supabase](https://supabase.com) project (PostgreSQL + Storage)
- Optional: [Supabase CLI](https://supabase.com/docs/guides/cli) for migrations

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy environment variables:

```bash
cp .env.example .env
```

Fill in `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `SITE_URL`.

Enable **Email** auth in Supabase Dashboard → Authentication → Providers. Add `http://localhost:5173/**` to redirect URLs for password reset.

3. Apply database migrations (Supabase Dashboard SQL or CLI):

```bash
supabase db push
# or run SQL files in supabase/migrations/ manually
```

4. Seed admin user, categories, products, and blog posts:

```bash
npm run seed
```

5. Development (Vite + API on port 3001):

```bash
npm run dev:full
```

- Store & CMS: http://localhost:5173
- API / blog SSR (production-like): http://localhost:3001

## Production

```bash
npm run build
npm run start
```

Serves `dist/` and handles API + blog SSR on `PORT` (default 3001).

## CMS

| URL | Purpose |
|-----|---------|
| `/admin/login` | Admin login |
| `/admin` | Dashboard |
| `/admin/posts` | Blog posts |
| `/admin/products` | Shop products |
| `/admin/subscribers` | Newsletter emails + CSV export |

## Customer account

| URL | Purpose |
|-----|---------|
| `/account/login` | Sign in |
| `/account/register` | Create account |
| `/account` | Dashboard — recent orders & quick download |
| `/account/orders` | Purchase history |
| `/account/settings` | Edit profile & password reset |

Orders are stored in Supabase (`orders`, `order_items`, `profiles`). Payoneer webhook integration is documented in [`docs/PAYONEER_WEBHOOK.md`](docs/PAYONEER_WEBHOOK.md).

## Stack

- **Frontend:** React 18, Vite 5, React Router, Tailwind, Zustand, Tiptap (admin)
- **Server:** Express, JWT auth, Sharp → WebP uploads
- **Data:** Supabase PostgreSQL + Storage (`blog-images`, `product-images`)

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Vite only |
| `npm run dev:server` | Express API only |
| `npm run dev:full` | Vite + Express |
| `npm run build` | Production frontend build |
| `npm run start` | Production server |
| `npm run seed` | Seed database |
