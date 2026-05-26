import { Router } from 'express';
import { z } from 'zod';
import { requireSupabase } from '../lib/supabase.js';
import { authMiddleware } from '../middleware/auth.js';
import { slugify } from '../utils/slug.js';

const router = Router();

function mapProduct(row) {
  if (!row) return null;
  return {
    id: row.id,
    slug: row.slug,
    etsyId: row.etsy_id,
    etsyUrl: row.etsy_url,
    name: row.name,
    subtitle: row.subtitle,
    category: row.category,
    price: Number(row.price),
    originalPrice: row.original_price ? Number(row.original_price) : null,
    badge: row.badge,
    rating: Number(row.rating),
    reviews: row.reviews,
    description: row.description,
    includes: row.includes || [],
    canvaLink: row.canva_link,
    images: row.images || [],
    tags: row.tags || [],
    colors: row.colors || [],
    editableIn: row.editable_in,
    instant: row.instant,
    collection: row.collection,
    saleEndsSoon: row.sale_ends_soon,
    featured: row.featured,
    active: row.active,
  };
}

// Public
router.get('/', async (req, res) => {
  try {
    const supabase = requireSupabase();
    let query = supabase.from('products').select('*').eq('active', true);
    if (req.query.category && req.query.category !== 'all') {
      query = query.eq('category', req.query.category);
    }
    if (req.query.featured === 'true') query = query.eq('featured', true);
    const { data, error } = await query.order('id');
    if (error) throw error;
    res.json({ products: (data || []).map(mapProduct) });
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message });
  }
});

router.get('/:idOrSlug', async (req, res) => {
  try {
    const supabase = requireSupabase();
    const key = req.params.idOrSlug;
    const isNumeric = /^\d+$/.test(key);
    let query = supabase.from('products').select('*').eq('active', true);
    query = isNumeric ? query.eq('id', Number(key)) : query.eq('slug', key);
    const { data, error } = await query.single();
    if (error || !data) return res.status(404).json({ error: 'Product not found' });
    res.json({ product: mapProduct(data) });
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message });
  }
});

// Admin CRUD
const admin = Router();
admin.use(authMiddleware);

const productSchema = z.object({
  name: z.string().min(1),
  slug: z.string().optional(),
  etsy_id: z.string().optional(),
  etsy_url: z.string().optional(),
  subtitle: z.string().optional(),
  category: z.string(),
  price: z.number(),
  original_price: z.number().nullable().optional(),
  badge: z.string().nullable().optional(),
  description: z.string().optional(),
  includes: z.array(z.string()).optional(),
  canva_link: z.string().optional(),
  images: z.array(z.string().min(1)).min(1, 'At least one product image is required'),
  tags: z.array(z.string()).optional(),
  colors: z.array(z.string()).optional(),
  collection: z.string().optional(),
  featured: z.boolean().optional(),
  active: z.boolean().optional(),
  sale_ends_soon: z.boolean().optional(),
});

admin.get('/', async (_req, res) => {
  const supabase = requireSupabase();
  const { data } = await supabase.from('products').select('*').order('id');
  res.json({ products: (data || []).map(mapProduct) });
});

admin.get('/:id', async (req, res) => {
  try {
    const supabase = requireSupabase();
    const { data, error } = await supabase.from('products').select('*').eq('id', req.params.id).maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Product not found' });
    res.json({ product: mapProduct(data) });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

function productError(res, e) {
  if (e?.name === 'ZodError') {
    const msg = e.issues?.[0]?.message || 'Invalid product data';
    return res.status(400).json({ error: msg });
  }
  return res.status(500).json({ error: e.message });
}

admin.post('/', async (req, res) => {
  try {
    const supabase = requireSupabase();
    const p = productSchema.parse(req.body);
    const row = {
      ...p,
      slug: p.slug || slugify(p.name),
      updated_at: new Date().toISOString(),
    };
    const { data, error } = await supabase.from('products').insert(row).select().single();
    if (error) throw error;
    res.status(201).json({ product: mapProduct(data) });
  } catch (e) {
    productError(res, e);
  }
});

admin.put('/:id', async (req, res) => {
  try {
    const supabase = requireSupabase();
    const p = productSchema.parse(req.body);
    const row = { ...p, updated_at: new Date().toISOString() };
    const { data, error } = await supabase.from('products').update(row).eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json({ product: mapProduct(data) });
  } catch (e) {
    productError(res, e);
  }
});

admin.delete('/:id', async (req, res) => {
  const supabase = requireSupabase();
  await supabase.from('products').update({ active: false }).eq('id', req.params.id);
  res.json({ ok: true });
});

export const productAdminRouter = admin;
export default router;
