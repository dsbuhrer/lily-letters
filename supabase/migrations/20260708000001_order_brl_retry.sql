-- Audit fields for USD → BRL payment retry after currency_not_supported.

ALTER TABLE orders ADD COLUMN IF NOT EXISTS original_subtotal_cents INTEGER;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS original_currency TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS stripe_fx_quote_id TEXT;
