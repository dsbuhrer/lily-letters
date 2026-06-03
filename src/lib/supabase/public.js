import { requireSupabase } from './client';
import { mapProduct, mapPost } from './mappers';
import { slugify } from '../utils/slug';

export async function getProducts(params = {}) {
  const supabase = requireSupabase();
  let query = supabase.from('products').select('*').eq('active', true);
  if (params.category && params.category !== 'all') {
    query = query.eq('category', params.category);
  }
  if (params.featured === 'true' || params.featured === true) {
    query = query.eq('featured', true);
  }
  const { data, error } = await query.order('id');
  if (error) throw new Error(error.message);
  return { products: (data || []).map(mapProduct) };
}

export async function getProduct(idOrSlug) {
  const supabase = requireSupabase();
  const key = String(idOrSlug);
  const isNumeric = /^\d+$/.test(key);
  let query = supabase.from('products').select('*').eq('active', true);
  query = isNumeric ? query.eq('id', Number(key)) : query.eq('slug', key);
  const { data, error } = await query.maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error('Product not found');
  return { product: mapProduct(data) };
}

export async function getProductCategories() {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from('product_categories')
    .select('*')
    .is('deleted_at', null)
    .order('sort_order');
  if (error) throw new Error(error.message);
  return { categories: data || [] };
}

export async function getCategories() {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .is('deleted_at', null)
    .order('sort_order');
  if (error) throw new Error(error.message);
  return { categories: data || [] };
}

export async function getPosts(params = {}) {
  const supabase = requireSupabase();
  const {
    category,
    tag,
    q,
    page = 1,
    sort = 'new',
    limit = 12,
    status = 'published',
  } = params;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(50, parseInt(limit, 10) || 12);
  const from = (pageNum - 1) * limitNum;
  const to = from + limitNum - 1;

  let query = supabase
    .from('posts')
    .select('*, categories(id, slug, name)', { count: 'exact' });

  if (status) query = query.eq('status', status);

  if (category) {
    const { data: cat } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', category)
      .is('deleted_at', null)
      .maybeSingle();
    if (cat) query = query.eq('category_id', cat.id);
  }

  if (tag) {
    const humanLabel = tag.replace(/-/g, ' ');
    const variants = [...new Set([tag, humanLabel, slugify(humanLabel)])].filter(Boolean);
    const orFilter = variants
      .map((v) => `tag_slugs.cs.${JSON.stringify([v])}`)
      .join(',');
    query = query.or(orFilter);
  }

  if (q) {
    query = query.textSearch('search_vector', q, { type: 'websearch', config: 'english' });
  }

  if (sort === 'popular') query = query.order('view_count', { ascending: false });
  else if (sort === 'trending') {
    query = query.order('featured', { ascending: false }).order('view_count', { ascending: false });
  } else query = query.order('published_at', { ascending: false });

  query = query.range(from, to);

  const { data, error, count } = await query;
  if (error) throw new Error(error.message);

  return {
    posts: (data || []).map((p) => mapPost(p, p.categories)),
    pagination: { page: pageNum, limit: limitNum, total: count || 0 },
  };
}

export async function getPost(slug) {
  const supabase = requireSupabase();
  const { data: post, error } = await supabase
    .from('posts')
    .select('*, categories(id, slug, name)')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!post) throw new Error('Post not found');

  try {
    await supabase.rpc('increment_post_views', { post_id: post.id });
  } catch {
    /* optional */
  }

  let related = [];
  if (post.category_id) {
    const { data: rel } = await supabase
      .from('posts')
      .select(
        'id, slug, title, excerpt, hero_image, hero_alt, published_at, reading_time_minutes, categories(id, slug, name)',
      )
      .eq('status', 'published')
      .eq('category_id', post.category_id)
      .neq('id', post.id)
      .order('published_at', { ascending: false })
      .limit(4);
    related = (rel || []).map((p) => mapPost(p, p.categories));
  }

  let relatedProducts = [];
  const ids = post.related_product_ids || [];
  if (ids.length) {
    const { data: prods } = await supabase
      .from('products')
      .select('*')
      .in('id', ids)
      .eq('active', true);
    relatedProducts = (prods || []).map(mapProduct);
  }

  return {
    post: mapPost(post, post.categories),
    related,
    relatedProducts,
  };
}
