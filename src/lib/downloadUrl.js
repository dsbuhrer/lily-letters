import { requireSupabase } from './supabase/client';

const BUCKET = 'product-downloads';
const SIGNED_URL_TTL = 3600;

/**
 * @param {string} storagePath - path inside product-downloads bucket
 * @returns {Promise<string>} signed download URL
 */
export async function getSignedDownloadUrl(storagePath) {
  if (!storagePath?.trim()) {
    throw new Error('Download path is missing.');
  }

  const supabase = requireSupabase();
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, SIGNED_URL_TTL);

  if (error) throw new Error(error.message);
  if (!data?.signedUrl) throw new Error('Could not generate download link.');

  return data.signedUrl;
}

/**
 * Returns true if value looks like a storage path (not a legacy http URL).
 */
export function isStoragePath(value) {
  return Boolean(value && !value.startsWith('http'));
}
