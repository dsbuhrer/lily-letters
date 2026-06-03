-- Soft delete for blog post categories

ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_slug_key;

CREATE UNIQUE INDEX IF NOT EXISTS categories_slug_active_unique
  ON categories (slug)
  WHERE deleted_at IS NULL;

DROP POLICY IF EXISTS categories_select_public ON categories;

CREATE POLICY categories_select_public ON categories
  FOR SELECT
  USING (deleted_at IS NULL OR public.is_admin());
