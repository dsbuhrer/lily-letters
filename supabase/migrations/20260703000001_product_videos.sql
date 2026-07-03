-- Product showcase videos (public bucket, displayed on product page)
ALTER TABLE products ADD COLUMN IF NOT EXISTS videos JSONB DEFAULT '[]';

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-videos',
  'product-videos',
  true,
  52428800,
  ARRAY['video/mp4', 'video/webm', 'video/quicktime']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY storage_product_videos_read ON storage.objects
  FOR SELECT
  USING (bucket_id = 'product-videos');

CREATE POLICY storage_admin_insert_videos ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'product-videos'
    AND public.is_admin()
  );

CREATE POLICY storage_admin_update_videos ON storage.objects
  FOR UPDATE
  USING (bucket_id = 'product-videos' AND public.is_admin())
  WITH CHECK (bucket_id = 'product-videos' AND public.is_admin());

CREATE POLICY storage_admin_delete_videos ON storage.objects
  FOR DELETE
  USING (bucket_id = 'product-videos' AND public.is_admin());
