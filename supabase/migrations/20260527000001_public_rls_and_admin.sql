-- Public RLS, staff admin roles, secure post views, storage policies

-- Staff roles (Supabase Auth admins)
CREATE TABLE staff_roles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE staff_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY staff_roles_select_own ON staff_roles
  FOR SELECT USING (user_id = auth.uid());

-- Admin check (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.staff_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, anon;

-- Secure post view counter
CREATE OR REPLACE FUNCTION increment_post_views(post_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE posts
  SET view_count = view_count + 1
  WHERE id = post_id AND status = 'published';
END;
$$;

REVOKE ALL ON FUNCTION increment_post_views(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION increment_post_views(UUID) TO anon, authenticated;

-- Public read: products, posts, categories, tags
CREATE POLICY products_select_public ON products
  FOR SELECT USING (active = true OR public.is_admin());

CREATE POLICY products_admin_all ON products
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY posts_select_public ON posts
  FOR SELECT USING (status = 'published' OR public.is_admin());

CREATE POLICY posts_admin_all ON posts
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY categories_select_public ON categories
  FOR SELECT USING (true);

CREATE POLICY categories_admin_all ON categories
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY tags_select_public ON tags
  FOR SELECT USING (true);

CREATE POLICY tags_admin_all ON tags
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Newsletter: public insert only
CREATE POLICY subscribers_insert_public ON subscribers
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY subscribers_admin_all ON subscribers
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Contact form: public insert only
CREATE POLICY contacts_insert_public ON contacts
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY contacts_admin_all ON contacts
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Post views: insert via service/edge only (no direct client insert policy)
CREATE POLICY post_views_admin ON post_views
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Profiles: admin can read all for support
CREATE POLICY profiles_admin_select ON profiles
  FOR SELECT USING (public.is_admin());

-- Orders: admin read all
CREATE POLICY orders_admin_select ON orders
  FOR SELECT USING (public.is_admin());

CREATE POLICY order_items_admin_select ON order_items
  FOR SELECT USING (public.is_admin());

-- Storage: public read, admin write
CREATE POLICY storage_public_read ON storage.objects
  FOR SELECT
  USING (bucket_id IN ('blog-images', 'product-images'));

CREATE POLICY storage_admin_insert ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id IN ('blog-images', 'product-images')
    AND public.is_admin()
  );

CREATE POLICY storage_admin_update ON storage.objects
  FOR UPDATE
  USING (bucket_id IN ('blog-images', 'product-images') AND public.is_admin())
  WITH CHECK (bucket_id IN ('blog-images', 'product-images') AND public.is_admin());

CREATE POLICY storage_admin_delete ON storage.objects
  FOR DELETE
  USING (bucket_id IN ('blog-images', 'product-images') AND public.is_admin());
