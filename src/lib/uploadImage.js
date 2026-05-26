import { requireSupabase } from './supabase/client';

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

async function fileToWebpBlob(file) {
  if (file.type === 'image/webp' && file.size <= MAX_BYTES) return file;

  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const max = 2400;
      let { width, height } = img;
      if (width > max || height > max) {
        const ratio = Math.min(max / width, max / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (!blob) reject(new Error('Failed to process image'));
          else resolve(blob);
        },
        'image/webp',
        0.85,
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Invalid image file'));
    };
    img.src = url;
  });
}

export async function uploadImage(file, bucket = 'blog-images', prefix = 'uploads') {
  const type = (file.type || '').toLowerCase();
  if (type === 'image/heic' || type === 'image/heif') {
    throw new Error('HEIC is not supported. Save the photo as JPEG or PNG before uploading.');
  }
  if (!ALLOWED.includes(type)) {
    throw new Error('Invalid image type. Use JPEG, PNG, WebP, or GIF.');
  }
  if (file.size > MAX_BYTES * 2) {
    throw new Error('Image too large (max 5MB)');
  }

  const blob = await fileToWebpBlob(file);
  if (blob.size > MAX_BYTES) {
    throw new Error('Image too large after compression (max 5MB)');
  }

  const supabase = requireSupabase();
  const fileName = `${prefix}/${Date.now()}-${Math.random().toString(36).slice(2)}.webp`;
  const { error } = await supabase.storage.from(bucket).upload(fileName, blob, {
    contentType: 'image/webp',
    upsert: false,
  });
  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
  return { url: data.publicUrl };
}
