-- Lily Letters Co. — Blog + CMS schema

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Admin users (CMS login — not Supabase Auth)
CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT 'Admin',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_login_at TIMESTAMPTZ
);

-- Blog categories
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  meta_title TEXT,
  meta_description TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tags
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Products (shop + CMS)
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  etsy_id TEXT,
  etsy_url TEXT,
  name TEXT NOT NULL,
  subtitle TEXT,
  category TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  original_price NUMERIC(10,2),
  badge TEXT,
  rating NUMERIC(2,1) DEFAULT 5.0,
  reviews INT DEFAULT 0,
  description TEXT,
  includes JSONB DEFAULT '[]',
  canva_link TEXT,
  images JSONB DEFAULT '[]',
  tags JSONB DEFAULT '[]',
  colors JSONB DEFAULT '[]',
  editable_in TEXT DEFAULT 'Canva',
  instant BOOLEAN DEFAULT true,
  collection TEXT,
  sale_ends_soon BOOLEAN DEFAULT false,
  featured BOOLEAN DEFAULT false,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Blog posts
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  excerpt TEXT,
  direct_answer TEXT,
  content TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  meta_title TEXT,
  meta_description TEXT,
  canonical_url TEXT,
  og_image TEXT,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  tag_slugs JSONB DEFAULT '[]',
  faq JSONB DEFAULT '[]',
  related_product_ids JSONB DEFAULT '[]',
  author_name TEXT DEFAULT 'The Lily Letters Co.',
  author_bio TEXT,
  author_avatar TEXT,
  hero_image TEXT,
  hero_alt TEXT,
  reading_time_minutes INT DEFAULT 1,
  seo_keywords JSONB DEFAULT '[]',
  featured BOOLEAN DEFAULT false,
  view_count INT DEFAULT 0,
  published_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  search_vector TSVECTOR GENERATED ALWAYS AS (
    to_tsvector('english', coalesce(title, '') || ' ' || coalesce(excerpt, '') || ' ' || coalesce(content, ''))
  ) STORED
);

-- Newsletter subscribers
CREATE TABLE subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  source TEXT NOT NULL DEFAULT 'footer' CHECK (source IN ('footer', 'blog', 'checkout')),
  consent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_hash TEXT,
  unsubscribed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Post views (popularity)
CREATE TABLE post_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_posts_status_published ON posts(status, published_at DESC);
CREATE INDEX idx_posts_category ON posts(category_id);
CREATE INDEX idx_posts_search ON posts USING GIN(search_vector);
CREATE INDEX idx_posts_featured ON posts(featured) WHERE status = 'published';
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_active ON products(active);
CREATE INDEX idx_post_views_post ON post_views(post_id);

-- RLS
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_views ENABLE ROW LEVEL SECURITY;

-- No public policies — API uses service role only
