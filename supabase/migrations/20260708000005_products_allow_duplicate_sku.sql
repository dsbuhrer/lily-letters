-- Allow duplicate SKUs across active products (SKU is informational, not a unique key).
DROP INDEX IF EXISTS public.products_sku_active_unique;
