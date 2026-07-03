import { requireSupabase } from './supabase/client';

const BUCKET = 'product-videos';
const MAX_BYTES = 50 * 1024 * 1024;
const ALLOWED = ['video/mp4', 'video/webm', 'video/quicktime'];

const EXT_BY_TYPE = {
  'video/mp4': 'mp4',
  'video/webm': 'webm',
  'video/quicktime': 'mov',
};

export async function uploadProductVideo(file) {
  const type = (file.type || '').toLowerCase();
  if (!ALLOWED.includes(type)) {
    throw new Error('Invalid video type. Use MP4, WebM, or MOV.');
  }
  if (file.size > MAX_BYTES) {
    throw new Error('Video too large (max 50 MB).');
  }

  const supabase = requireSupabase();
  const ext = EXT_BY_TYPE[type] || 'mp4';
  const fileName = `uploads/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(fileName, file, {
    contentType: type,
    upsert: false,
  });
  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(fileName);
  return { url: data.publicUrl };
}
