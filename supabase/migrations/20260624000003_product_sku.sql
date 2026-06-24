-- Product SKU for easier lookup in admin and on the storefront
ALTER TABLE products ADD COLUMN IF NOT EXISTS sku TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_products_sku ON products (sku) WHERE sku IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_products_sku_search ON products (lower(sku)) WHERE sku IS NOT NULL;
