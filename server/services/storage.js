import sharp from 'sharp';
import { requireSupabase } from '../lib/supabase.js';

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_BYTES = 5 * 1024 * 1024;

export async function uploadImage(buffer, mimeType, bucket, pathPrefix) {
  if (!ALLOWED.includes(mimeType)) {
    throw Object.assign(new Error('Invalid image type'), { status: 400 });
  }
  if (buffer.length > MAX_BYTES) {
    throw Object.assign(new Error('Image too large (max 5MB)'), { status: 400 });
  }

  const webp = await sharp(buffer)
    .rotate()
    .resize(2400, 2400, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 85 })
    .toBuffer();

  const fileName = `${pathPrefix}/${Date.now()}-${Math.random().toString(36).slice(2)}.webp`;
  const supabase = requireSupabase();

  const { error } = await supabase.storage.from(bucket).upload(fileName, webp, {
    contentType: 'image/webp',
    upsert: false,
  });

  if (error) throw Object.assign(new Error(error.message), { status: 500 });

  const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
  return data.publicUrl;
}
