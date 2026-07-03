-- Replace Payoneer payment fields with Stripe; remove download expiration.

ALTER TABLE orders DROP COLUMN IF EXISTS payoneer_payment_id;
ALTER TABLE orders DROP COLUMN IF EXISTS payoneer_status;
ALTER TABLE orders DROP COLUMN IF EXISTS download_expires_at;

ALTER TABLE orders ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT UNIQUE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS stripe_charge_id TEXT;

ALTER TABLE orders ALTER COLUMN payment_provider SET DEFAULT 'stripe';

UPDATE orders SET payment_provider = 'stripe' WHERE payment_provider IN ('payoneer', 'mock');
