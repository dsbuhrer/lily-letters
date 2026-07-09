-- Coupons, bulk-sale snapshot columns, and order discount tracking

-- Bulk sale snapshot on products (reversible without losing manual original_price)
ALTER TABLE products ADD COLUMN IF NOT EXISTS on_sale BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS pre_sale_state JSONB;

-- Coupons
CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL,
  description TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percent', 'fixed')),
  discount_value NUMERIC(10,2) NOT NULL,
  scope TEXT NOT NULL DEFAULT 'cart' CHECK (scope IN ('cart', 'products')),
  min_subtotal_cents INTEGER,
  max_redemptions INTEGER,
  times_redeemed INTEGER NOT NULL DEFAULT 0,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_coupons_code_upper ON coupons (upper(code));

CREATE TABLE IF NOT EXISTS coupon_products (
  coupon_id UUID NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  PRIMARY KEY (coupon_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_coupon_products_product ON coupon_products(product_id);

-- Order discount columns
ALTER TABLE orders ADD COLUMN IF NOT EXISTS gross_subtotal_cents INTEGER;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_cents INTEGER NOT NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_code TEXT;

-- Backfill gross_subtotal for existing orders
UPDATE orders
SET gross_subtotal_cents = subtotal_cents
WHERE gross_subtotal_cents IS NULL;

ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_products ENABLE ROW LEVEL SECURITY;
