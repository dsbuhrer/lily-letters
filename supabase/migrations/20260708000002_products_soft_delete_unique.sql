-- Products: allow reusing slug/SKU after soft delete (active=false)
-- We keep rows for order history, but uniqueness should only apply to active products.

-- Ensure sku column exists (some older DBs may have been created manually).
ALTER TABLE products ADD COLUMN IF NOT EXISTS sku TEXT;

-- Drop any existing UNIQUE constraints/indexes on slug/sku so we can replace
-- them with partial unique indexes scoped to active products only.
DO $$
DECLARE
  r RECORD;
BEGIN
  -- Drop UNIQUE constraints that include slug or sku
  FOR r IN (
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public'
      AND t.relname = 'products'
      AND c.contype = 'u'
      AND EXISTS (
        SELECT 1
        FROM unnest(c.conkey) AS k(attnum)
        JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = k.attnum
        WHERE a.attname IN ('slug', 'sku')
      )
  ) LOOP
    EXECUTE format('ALTER TABLE public.products DROP CONSTRAINT IF EXISTS %I', r.conname);
  END LOOP;

  -- Drop UNIQUE indexes directly on slug/sku (in case they were created as indexes, not constraints)
  FOR r IN (
    SELECT i.relname AS index_name
    FROM pg_class t
    JOIN pg_namespace n ON n.oid = t.relnamespace
    JOIN pg_index ix ON ix.indrelid = t.oid
    JOIN pg_class i ON i.oid = ix.indexrelid
    WHERE n.nspname = 'public'
      AND t.relname = 'products'
      AND ix.indisunique = true
      AND ix.indisprimary = false
      AND (
        pg_get_indexdef(i.oid) ILIKE '%(slug)%'
        OR pg_get_indexdef(i.oid) ILIKE '%(sku)%'
      )
  ) LOOP
    EXECUTE format('DROP INDEX IF EXISTS public.%I', r.index_name);
  END LOOP;
END
$$;

-- Unique among active products only.
CREATE UNIQUE INDEX IF NOT EXISTS products_slug_active_unique
  ON public.products (slug)
  WHERE active = true;

-- SKU is optional; enforce uniqueness only when present and active.
CREATE UNIQUE INDEX IF NOT EXISTS products_sku_active_unique
  ON public.products (sku)
  WHERE active = true AND sku IS NOT NULL AND btrim(sku) <> '';

