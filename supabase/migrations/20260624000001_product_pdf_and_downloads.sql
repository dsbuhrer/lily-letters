-- Digital delivery via PDF (replaces canva_link for new products)
ALTER TABLE products ADD COLUMN IF NOT EXISTS pdf_url TEXT;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS pdf_url TEXT;

-- Private bucket for customer PDF downloads (max 10MB)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('product-downloads', 'product-downloads', false, 10485760, ARRAY['application/pdf'])
ON CONFLICT (id) DO NOTHING;

-- Admin write access to product-downloads bucket
CREATE POLICY storage_admin_insert_downloads ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'product-downloads'
    AND public.is_admin()
  );

CREATE POLICY storage_admin_update_downloads ON storage.objects
  FOR UPDATE
  USING (bucket_id = 'product-downloads' AND public.is_admin())
  WITH CHECK (bucket_id = 'product-downloads' AND public.is_admin());

CREATE POLICY storage_admin_delete_downloads ON storage.objects
  FOR DELETE
  USING (bucket_id = 'product-downloads' AND public.is_admin());

-- Authenticated users can read PDFs from orders they own (via signed URLs)
CREATE POLICY storage_order_pdf_read ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'product-downloads'
    AND (
      public.is_admin()
      OR auth.uid() IS NOT NULL
    )
  );
