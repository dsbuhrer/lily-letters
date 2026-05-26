-- Contact form submissions (site → CMS)

CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  topic TEXT,
  message TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'contact',
  read_at TIMESTAMPTZ,
  ip_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_contacts_created_at ON contacts(created_at DESC);
CREATE INDEX idx_contacts_unread ON contacts(created_at DESC) WHERE read_at IS NULL;

ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
