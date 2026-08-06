-- Product reviews from post-purchase invites + real rating aggregates

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS review_token UUID UNIQUE DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS review_email_sent_at TIMESTAMPTZ;

-- Backfill tokens for existing paid orders that somehow lack one
UPDATE orders
SET review_token = gen_random_uuid()
WHERE review_token IS NULL;

CREATE TABLE IF NOT EXISTS product_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  order_item_id UUID REFERENCES order_items(id) ON DELETE SET NULL,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  rating SMALLINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  body TEXT,
  author_name TEXT NOT NULL,
  author_email TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (order_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_product_reviews_product_id ON product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_created ON product_reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_review_token ON orders(review_token);

-- Clear fake seed aggregates so stars only appear after real reviews
UPDATE products SET rating = NULL, reviews = 0;

CREATE OR REPLACE FUNCTION public.recalc_product_rating(p_product_id INTEGER)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_avg NUMERIC(2,1);
  v_count INT;
BEGIN
  IF p_product_id IS NULL THEN
    RETURN;
  END IF;

  SELECT ROUND(AVG(rating)::numeric, 1), COUNT(*)::int
  INTO v_avg, v_count
  FROM product_reviews
  WHERE product_id = p_product_id;

  IF COALESCE(v_count, 0) = 0 THEN
    UPDATE products SET rating = NULL, reviews = 0 WHERE id = p_product_id;
  ELSE
    UPDATE products SET rating = v_avg, reviews = v_count WHERE id = p_product_id;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.product_reviews_recalc_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.recalc_product_rating(OLD.product_id);
    RETURN OLD;
  END IF;

  PERFORM public.recalc_product_rating(NEW.product_id);
  IF TG_OP = 'UPDATE' AND OLD.product_id IS DISTINCT FROM NEW.product_id THEN
    PERFORM public.recalc_product_rating(OLD.product_id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_product_reviews_recalc ON product_reviews;
CREATE TRIGGER trg_product_reviews_recalc
  AFTER INSERT OR UPDATE OR DELETE ON product_reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.product_reviews_recalc_trigger();

ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;

-- Public can read reviews for product pages
CREATE POLICY product_reviews_public_select ON product_reviews
  FOR SELECT
  USING (true);

-- Admin full access (list + delete)
CREATE POLICY product_reviews_admin_all ON product_reviews
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Inserts happen via service role in edge functions (bypasses RLS)
