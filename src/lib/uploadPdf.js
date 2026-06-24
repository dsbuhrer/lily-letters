import { requireSupabase } from './supabase/client';

const MAX_BYTES = 10 * 1024 * 1024;
const BUCKET = 'product-downloads';

export async function uploadProductPdf(file) {
  const type = (file.type || '').toLowerCase();
  if (type !== 'application/pdf') {
    throw new Error('Invalid file type. Use a PDF file.');
  }
  if (file.size > MAX_BYTES) {
    throw new Error('PDF too large (max 10 MB).');
  }

  const supabase = requireSupabase();
  const fileName = `uploads/${Date.now()}-${Math.random().toString(36).slice(2)}.pdf`;
  const { error } = await supabase.storage.from(BUCKET).upload(fileName, file, {
    contentType: 'application/pdf',
    upsert: false,
  });
  if (error) throw new Error(error.message);

  return { path: fileName };
}
