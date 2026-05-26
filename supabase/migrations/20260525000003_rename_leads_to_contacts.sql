-- Rename legacy `leads` table if migration 20260525000002_leads.sql was already applied

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'leads'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'contacts'
  ) THEN
    ALTER TABLE leads RENAME TO contacts;
    ALTER INDEX IF EXISTS idx_leads_created_at RENAME TO idx_contacts_created_at;
    ALTER INDEX IF EXISTS idx_leads_unread RENAME TO idx_contacts_unread;
  END IF;
END $$;
