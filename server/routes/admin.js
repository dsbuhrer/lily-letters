import { Router } from 'express';
import multer from 'multer';
import sanitizeHtml from 'sanitize-html';
import { z } from 'zod';
import { requireSupabase } from '../lib/supabase.js';
import { authMiddleware } from '../middleware/auth.js';
import { uploadImage } from '../services/storage.js';
import { slugify, readingTime } from '../utils/slug.js';
import { sanitizeOptions } from './posts.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.use(authMiddleware);

const postSchema = z.object({
  title: z.string().min(1),
  slug: z.string().optional(),
  excerpt: z.string().optional(),
  direct_answer: z.string().optional(),
  content: z.string().optional(),
  status: z.enum(['draft', 'published']).optional(),
  meta_title: z.string().optional(),
  meta_description: z.string().optional(),
  canonical_url: z.string().optional(),
  og_image: z.string().optional(),
  category_id: z.string().uuid().nullable().optional(),
  tag_slugs: z.array(z.string()).optional(),
  faq: z.array(z.object({ question: z.string(), answer: z.string() })).optional(),
  related_product_ids: z.array(z.number()).optional(),
  author_name: z.string().optional(),
  author_bio: z.string().optional(),
  author_avatar: z.string().optional(),
  hero_image: z.string().optional(),
  hero_alt: z.string().optional(),
  seo_keywords: z.array(z.string()).optional(),
  featured: z.boolean().optional(),
});

function preparePost(body, existingSlug) {
  const parsed = postSchema.parse(body);
  const slug = parsed.slug || slugify(parsed.title);
  const content = sanitizeHtml(parsed.content || '', sanitizeOptions);
  return {
    ...parsed,
    slug: existingSlug || slug,
    content,
    reading_time_minutes: readingTime(content),
    updated_at: new Date().toISOString(),
  };
}

// --- Posts ---
router.get('/posts', async (req, res) => {
  try {
    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from('posts')
      .select('*, categories(id, slug, name)')
      .order('updated_at', { ascending: false });
    if (error) throw error;
    res.json({ posts: data });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/posts/:id', async (req, res) => {
  try {
    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from('posts')
      .select('*, categories(id, slug, name)')
      .eq('id', req.params.id)
      .single();
    if (error) throw error;
    res.json({ post: data });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/posts', async (req, res) => {
  try {
    const supabase = requireSupabase();
    const row = preparePost(req.body);
    if (row.status === 'published' && !row.published_at) {
      row.published_at = new Date().toISOString();
    }
    const { data, error } = await supabase.from('posts').insert(row).select().single();
    if (error) throw error;
    res.status(201).json({ post: data });
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message });
  }
});

router.put('/posts/:id', async (req, res) => {
  try {
    const supabase = requireSupabase();
    const { data: existing } = await supabase.from('posts').select('slug, status, published_at').eq('id', req.params.id).single();
    const row = preparePost(req.body, existing?.slug);
    if (row.status === 'published' && existing?.status !== 'published') {
      row.published_at = new Date().toISOString();
    }
    const { data, error } = await supabase.from('posts').update(row).eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json({ post: data });
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message });
  }
});

router.delete('/posts/:id', async (req, res) => {
  try {
    const supabase = requireSupabase();
    const { error } = await supabase.from('posts').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/posts/:id/publish', async (req, res) => {
  try {
    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from('posts')
      .update({ status: 'published', published_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) throw error;
    res.json({ post: data });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// --- Categories & tags ---
router.get('/categories', async (_req, res) => {
  const supabase = requireSupabase();
  const { data } = await supabase.from('categories').select('*').order('sort_order');
  res.json({ categories: data });
});

router.get('/tags', async (_req, res) => {
  const supabase = requireSupabase();
  const { data } = await supabase.from('tags').select('*').order('name');
  res.json({ tags: data });
});

// --- Upload ---
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file' });
    const bucket = req.body.bucket === 'product-images' ? 'product-images' : 'blog-images';
    const url = await uploadImage(req.file.buffer, req.file.mimetype, bucket, req.body.prefix || 'uploads');
    res.json({ url });
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message });
  }
});

// --- Dashboard stats ---
router.get('/stats', async (_req, res) => {
  try {
    const supabase = requireSupabase();
    const [drafts, published, subs] = await Promise.all([
      supabase.from('posts').select('id', { count: 'exact', head: true }).eq('status', 'draft'),
      supabase.from('posts').select('id', { count: 'exact', head: true }).eq('status', 'published'),
      supabase.from('subscribers').select('id', { count: 'exact', head: true }).is('unsubscribed_at', null),
    ]);
    res.json({
      drafts: drafts.count || 0,
      published: published.count || 0,
      subscribers: subs.count || 0,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
