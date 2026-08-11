import { requireSupabase } from './client';
import { mapProduct, mapPost } from './mappers';
import { slugify } from '../utils/slug';
import { normalizeTags, nameFromSlug } from '../blogTags';

async function enrichTags(supabase, tagSlugs) {
  const normalized = normalizeTags(tagSlugs);
  if (!normalized.length) return [];

  const slugs = normalized.map((t) => t.slug);
  const { data } = await supabase.from('tags').select('slug, name').in('slug', slugs);
  const nameBySlug = Object.fromEntries((data || []).map((t) => [t.slug, t.name]));

  return normalized.map((t) => ({
    slug: t.slug,
    name: nameBySlug[t.slug] || t.name,
  }));
}

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

export async function getProductReviews(productId) {
  const supabase = requireSupabase();
  const id = Number(productId);
  if (!Number.isFinite(id) || id <= 0) return { reviews: [] };

  const { data, error } = await supabase
    .from('product_reviews')
    .select('id, rating, body, author_name, created_at')
    .eq('product_id', id)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return {
    reviews: (data || []).map((row) => ({
      id: row.id,
      rating: row.rating,
      body: row.body,
      authorName: row.author_name,
      createdAt: row.created_at,
    })),
  };
}

export async function getProduct(idOrSlug) {
  const supabase = requireSupabase();
  const key = String(idOrSlug);
  const isNumeric = /^\d+$/.test(key);
  const base = () => supabase.from('products').select('*').eq('active', true);

  if (isNumeric) {
    const { data, error } = await base().eq('id', Number(key)).maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) throw new Error('Product not found');
    return { product: mapProduct(data) };
  }

  const { data: bySlug, error: slugError } = await base().eq('slug', key).maybeSingle();
  if (slugError) throw new Error(slugError.message);
  if (bySlug) return { product: mapProduct(bySlug) };

  const { data: bySku, error: skuError } = await base().eq('sku', key).limit(1).maybeSingle();
  if (skuError) throw new Error(skuError.message);
  if (!bySku) throw new Error('Product not found');
  return { product: mapProduct(bySku) };
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
    const slug = slugify(tag);
    const humanLabel = tag.replace(/-/g, ' ');
    const variants = [...new Set([slug, tag, humanLabel, slugify(humanLabel)])].filter(Boolean);
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

  const enrichedTags = await enrichTags(supabase, post.tag_slugs);
  const mapped = mapPost(post, post.categories);

  return {
    post: {
      ...mapped,
      tags: enrichedTags,
      tag_slugs: enrichedTags.map((t) => t.slug),
    },
    related,
    relatedProducts,
  };
}

export async function getTags(params = {}) {
  const supabase = requireSupabase();
  const { data: tags, error } = await supabase.from('tags').select('*').order('name');
  if (error) throw new Error(error.message);

  const { data: posts } = await supabase
    .from('posts')
    .select('tag_slugs')
    .eq('status', 'published');

  const counts = {};
  for (const post of posts || []) {
    for (const t of normalizeTags(post.tag_slugs || [])) {
      counts[t.slug] = (counts[t.slug] || 0) + 1;
    }
  }

  let result = (tags || []).map((t) => ({
    ...t,
    post_count: counts[t.slug] || 0,
  }));

  if (params.minPosts) {
    const min = parseInt(params.minPosts, 10) || 1;
    result = result.filter((t) => t.post_count >= min);
  }

  if (params.sort === 'popular') {
    result.sort((a, b) => b.post_count - a.post_count || a.name.localeCompare(b.name));
  }

  return { tags: result };
}

export async function getTag(slug) {
  const supabase = requireSupabase();
  const normalized = slugify(slug);
  const { data, error } = await supabase
    .from('tags')
    .select('*')
    .eq('slug', normalized)
    .maybeSingle();
  if (error) throw new Error(error.message);

  const tag = data || { slug: normalized, name: nameFromSlug(normalized) };

  const humanLabel = normalized.replace(/-/g, ' ');
  const variants = [...new Set([normalized, humanLabel])];
  const orFilter = variants.map((v) => `tag_slugs.cs.${JSON.stringify([v])}`).join(',');
  const { count } = await supabase
    .from('posts')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'published')
    .or(orFilter);

  return { tag: { ...tag, post_count: count || 0 } };
}
