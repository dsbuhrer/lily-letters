-- Contact form submissions go through submit-contact Edge Function (service role insert + email).

DROP POLICY IF EXISTS contacts_insert_public ON contacts;
