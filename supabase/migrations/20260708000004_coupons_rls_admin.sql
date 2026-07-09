-- coupons/coupon_products had RLS enabled without policies — block admin CRUD from the CMS

DROP POLICY IF EXISTS coupons_admin_all ON coupons;
CREATE POLICY coupons_admin_all ON coupons
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS coupon_products_admin_all ON coupon_products;
CREATE POLICY coupon_products_admin_all ON coupon_products
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
