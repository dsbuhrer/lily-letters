-- Expand post_views for device / geo analytics
ALTER TABLE post_views
  ADD COLUMN IF NOT EXISTS device_type TEXT NOT NULL DEFAULT 'unknown'
    CHECK (device_type IN ('desktop', 'mobile', 'tablet', 'unknown')),
  ADD COLUMN IF NOT EXISTS country_code TEXT,
  ADD COLUMN IF NOT EXISTS country_name TEXT,
  ADD COLUMN IF NOT EXISTS referrer TEXT,
  ADD COLUMN IF NOT EXISTS visitor_hash TEXT;

CREATE INDEX IF NOT EXISTS post_views_post_viewed_at_idx
  ON post_views (post_id, viewed_at DESC);

CREATE INDEX IF NOT EXISTS post_views_post_device_idx
  ON post_views (post_id, device_type);

CREATE INDEX IF NOT EXISTS post_views_post_country_idx
  ON post_views (post_id, country_code);

CREATE INDEX IF NOT EXISTS post_views_visitor_day_idx
  ON post_views (post_id, visitor_hash, viewed_at DESC);

-- View counter is owned by the track-post-view Edge Function (service role).
REVOKE EXECUTE ON FUNCTION increment_post_views(UUID) FROM anon, authenticated;
