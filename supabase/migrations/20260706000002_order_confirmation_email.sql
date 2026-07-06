-- Track order confirmation email delivery (idempotent send after payment)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS confirmation_email_sent_at TIMESTAMPTZ;
