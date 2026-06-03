-- Product shop categories (CMS-managed)

CREATE TABLE product_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL,
  label TEXT NOT NULL,
  group_name TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX product_categories_slug_active_unique
  ON product_categories (slug)
  WHERE deleted_at IS NULL;

ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY product_categories_select_public ON product_categories
  FOR SELECT
  USING (deleted_at IS NULL OR public.is_admin());

CREATE POLICY product_categories_admin_all ON product_categories
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

INSERT INTO product_categories (slug, label, group_name, sort_order) VALUES
  ('wedding-invitation', 'Wedding Invitation', 'WEDDING COLLECTIONS', 1),
  ('wedding-table-signs', 'Wedding Table Signs', 'WEDDING COLLECTIONS', 2),
  ('wedding-extras', 'Wedding Extras', 'WEDDING COLLECTIONS', 3),
  ('save-the-date', 'Save the Date', 'WEDDING COLLECTIONS', 4),
  ('bridal-shower-invite', 'Bridal Shower Invite', 'WEDDING COLLECTIONS', 5),
  ('bridal-shower-extras', 'Bridal Shower Extras', 'WEDDING COLLECTIONS', 6),
  ('baby-shower-invite', 'Baby Shower Invite', 'WEDDING COLLECTIONS', 7),
  ('baby-shower-extras', 'Baby Shower Extras', 'WEDDING COLLECTIONS', 8),
  ('christmas-invitation', 'Christmas Invitation', 'CHRISTMAS COLLECTION', 9),
  ('christmas-extras', 'Christmas Extras', 'CHRISTMAS COLLECTION', 10),
  ('bachelorette-invite', 'Bachelorette Invite', 'SEASONAL COLLECTIONS', 11);
