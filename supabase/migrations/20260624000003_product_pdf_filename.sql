-- Store the customer-facing PDF filename separately from the storage path
ALTER TABLE products ADD COLUMN IF NOT EXISTS pdf_file_name TEXT;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS pdf_file_name TEXT;
