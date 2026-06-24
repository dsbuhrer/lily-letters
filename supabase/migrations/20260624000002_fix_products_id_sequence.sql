-- Resync products.id SERIAL sequence after seed/import with explicit ids.
SELECT setval(
  pg_get_serial_sequence('public.products', 'id'),
  COALESCE((SELECT MAX(id) FROM public.products), 0)
);

CREATE OR REPLACE FUNCTION public.sync_products_id_sequence()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT setval(
    pg_get_serial_sequence('public.products', 'id'),
    COALESCE((SELECT MAX(id) FROM public.products), 0)
  );
$$;
