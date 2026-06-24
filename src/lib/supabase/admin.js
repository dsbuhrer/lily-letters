import { requireSupabase } from './client';
import { mapProduct } from './mappers';
import { sanitizePostContent } from '../sanitizePostHtml';
import { slugify, readingTime } from '../utils/slug';
import { normalizeTags, tagsToStorageSlugs, nameFromSlug } from '../blogTags';

async function syncPostTags(supabase, rawTags) {
  const tags = normalizeTags(rawTags);
  if (tags.length) {
    const { error } = await supabase.from('tags').upsert(
      tags.map((t) => ({ slug: t.slug, name: t.name })),
      { onConflict: 'slug' },
    );
    if (error) throw new Error(error.message);
  }
  return tagsToStorageSlugs(tags);
}

function preparePostRow(body, existingSlug, tagSlugs) {
  const slug = existingSlug || slugify(body.title);
  const content = sanitizePostContent(body.content || '');
  return {
    title: body.title,
    slug,
    excerpt: body.excerpt,
    direct_answer: body.direct_answer,
    content,
    status: body.status,
    meta_title: body.meta_title,
    meta_description: body.meta_description,
    canonical_url: body.canonical_url,
    og_image: body.og_image,
    category_id: body.category_id,
    tag_slugs: tagSlugs,
    faq: body.faq,
    related_product_ids: body.related_product_ids,
    author_name: body.author_name,
    author_bio: body.author_bio,
    author_avatar: body.author_avatar,
    hero_image: body.hero_image,
    hero_alt: body.hero_alt,
    seo_keywords: body.seo_keywords,
    featured: body.featured,
    reading_time_minutes: readingTime(content),
    updated_at: new Date().toISOString(),
  };
}

export async function getStats() {
  const supabase = requireSupabase();
  const [drafts, published, subs, contacts, contactsUnread] = await Promise.all([
    supabase.from('posts').select('id', { count: 'exact', head: true }).eq('status', 'draft'),
    supabase.from('posts').select('id', { count: 'exact', head: true }).eq('status', 'published'),
    supabase.from('subscribers').select('id', { count: 'exact', head: true }).is('unsubscribed_at', null),
    supabase.from('contacts').select('id', { count: 'exact', head: true }),
    supabase.from('contacts').select('id', { count: 'exact', head: true }).is('read_at', null),
  ]);
  return {
    drafts: drafts.count || 0,
    published: published.count || 0,
    subscribers: subs.count || 0,
    contacts: contacts.count || 0,
    contacts_unread: contactsUnread.count || 0,
  };
}

export async function listPosts() {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from('posts')
    .select('*, categories(id, slug, name)')
    .order('updated_at', { ascending: false });
  if (error) throw new Error(error.message);
  return { posts: data || [] };
}

export async function getPostById(id) {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from('posts')
    .select('*, categories(id, slug, name)')
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error('Post not found');

  const normalized = normalizeTags(data.tag_slugs || []);
  if (normalized.length) {
    const slugs = normalized.map((t) => t.slug);
    const { data: tagRows } = await supabase.from('tags').select('slug, name').in('slug', slugs);
    const nameBySlug = Object.fromEntries((tagRows || []).map((t) => [t.slug, t.name]));
    data.tag_slugs = slugs.map((s) => nameBySlug[s] || nameFromSlug(s));
  } else {
    data.tag_slugs = [];
  }

  return { post: data };
}

export async function savePost(body, id) {
  const supabase = requireSupabase();
  let existing;
  if (id) {
    const { data } = await supabase
      .from('posts')
      .select('slug, status, published_at')
      .eq('id', id)
      .maybeSingle();
    existing = data;
  }
  const tagSlugs = await syncPostTags(supabase, body.tag_slugs);
  const row = preparePostRow(body, existing?.slug, tagSlugs);
  if (row.status === 'published' && (!existing || existing.status !== 'published')) {
    row.published_at = new Date().toISOString();
  }

  if (id) {
    const { data, error } = await supabase.from('posts').update(row).eq('id', id).select().single();
    if (error) throw new Error(error.message);
    return { post: data };
  }
  const { data, error } = await supabase.from('posts').insert(row).select().single();
  if (error) throw new Error(error.message);
  return { post: data };
}

export async function deletePost(id) {
  const supabase = requireSupabase();
  const { error } = await supabase.from('posts').delete().eq('id', id);
  if (error) throw new Error(error.message);
  return { ok: true };
}

export async function publishPost(id) {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from('posts')
    .update({
      status: 'published',
      published_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return { post: data };
}

export async function listCategories(options = {}) {
  const supabase = requireSupabase();
  let query = supabase.from('categories').select('*').order('sort_order');
  if (!options.includeDeleted) {
    query = query.is('deleted_at', null);
  }
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return { categories: data || [] };
}

export async function getBlogCategory(id) {
  const supabase = requireSupabase();
  const { data, error } = await supabase.from('categories').select('*').eq('id', id).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error('Category not found');
  return { category: data };
}

export async function saveBlogCategory(body, id) {
  const supabase = requireSupabase();
  const slug = (body.slug || slugify(body.name)).trim();
  const row = {
    name: body.name?.trim(),
    slug,
    description: body.description?.trim() || null,
    meta_title: body.meta_title?.trim() || null,
    meta_description: body.meta_description?.trim() || null,
    sort_order: Number.isFinite(body.sort_order) ? body.sort_order : 0,
    deleted_at: null,
  };

  if (id) {
    const { data, error } = await supabase.from('categories').update(row).eq('id', id).select().single();
    if (error) throw new Error(error.message);
    return { category: data };
  }
  const { data, error } = await supabase.from('categories').insert(row).select().single();
  if (error) throw new Error(error.message);
  return { category: data };
}

export async function deleteBlogCategory(id) {
  const supabase = requireSupabase();
  const { error } = await supabase
    .from('categories')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .is('deleted_at', null);
  if (error) throw new Error(error.message);
  return { ok: true };
}

export async function listProductCategories(options = {}) {
  const supabase = requireSupabase();
  let query = supabase.from('product_categories').select('*').order('sort_order');
  if (!options.includeDeleted) {
    query = query.is('deleted_at', null);
  }
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return { categories: data || [] };
}

export async function getProductCategory(id) {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from('product_categories')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error('Category not found');
  return { category: data };
}

export async function saveProductCategory(body, id) {
  const supabase = requireSupabase();
  const slug = (body.slug || slugify(body.label)).trim();
  const row = {
    label: body.label?.trim(),
    slug,
    group_name: body.group_name?.trim() || null,
    sort_order: Number.isFinite(body.sort_order) ? body.sort_order : 0,
    deleted_at: null,
  };

  if (id) {
    const { data, error } = await supabase
      .from('product_categories')
      .update(row)
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return { category: data };
  }
  const { data, error } = await supabase.from('product_categories').insert(row).select().single();
  if (error) throw new Error(error.message);
  return { category: data };
}

export async function deleteProductCategory(id) {
  const supabase = requireSupabase();
  const { error } = await supabase
    .from('product_categories')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .is('deleted_at', null);
  if (error) throw new Error(error.message);
  return { ok: true };
}

export async function listProductsAdmin() {
  const supabase = requireSupabase();
  const { data, error } = await supabase.from('products').select('*').order('id');
  if (error) throw new Error(error.message);
  return { products: (data || []).map(mapProduct) };
}

export async function getProductAdmin(id) {
  const supabase = requireSupabase();
  const { data, error } = await supabase.from('products').select('*').eq('id', id).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error('Product not found');
  return { product: mapProduct(data) };
}

async function nextProductId(supabase) {
  const { data, error } = await supabase
    .from('products')
    .select('id')
    .order('id', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data?.id ?? 0) + 1;
}

export async function saveProduct(body, id) {
  const supabase = requireSupabase();
  const row = {
    name: body.name,
    slug: body.slug || slugify(body.name),
    subtitle: body.subtitle,
    category: body.category,
    price: body.price,
    original_price: body.original_price,
    badge: body.badge,
    description: body.description,
    includes: body.includes,
    canva_link: body.canva_link,
    pdf_url: body.pdf_url ?? null,
    images: body.images,
    tags: body.tags,
    colors: body.colors,
    collection: body.collection,
    featured: body.featured,
    active: body.active,
    sale_ends_soon: body.sale_ends_soon,
    updated_at: new Date().toISOString(),
  };

  if (id) {
    const { data, error } = await supabase.from('products').update(row).eq('id', id).select().single();
    if (error) throw new Error(error.message);
    return { product: mapProduct(data) };
  }
  const { data, error } = await supabase
    .from('products')
    .insert({ ...row, id: await nextProductId(supabase) })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return { product: mapProduct(data) };
}

export async function deleteProduct(id) {
  const supabase = requireSupabase();
  const { error } = await supabase.from('products').update({ active: false }).eq('id', id);
  if (error) throw new Error(error.message);
  return { ok: true };
}

export async function listSubscribers(params = {}) {
  const supabase = requireSupabase();
  let query = supabase
    .from('subscribers')
    .select('*')
    .is('unsubscribed_at', null)
    .order('created_at', { ascending: false });
  if (params.source) query = query.eq('source', params.source);
  if (params.q) query = query.ilike('email', `%${params.q}%`);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return { subscribers: data || [] };
}

export async function listContacts(params = {}) {
  const supabase = requireSupabase();
  let query = supabase.from('contacts').select('*').order('created_at', { ascending: false });
  if (params.unread === '1') query = query.is('read_at', null);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return { contacts: data || [] };
}

export async function updateContact(id, { read }) {
  const supabase = requireSupabase();
  const updates = {};
  if (read === true) updates.read_at = new Date().toISOString();
  if (read === false) updates.read_at = null;
  const { data, error } = await supabase
    .from('contacts')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return { contact: data };
}

export async function deleteContact(id) {
  const supabase = requireSupabase();
  const { error } = await supabase.from('contacts').delete().eq('id', id);
  if (error) throw new Error(error.message);
  return { ok: true };
}

export async function listTags() {
  const supabase = requireSupabase();
  const { data, error } = await supabase.from('tags').select('*').order('name');
  if (error) throw new Error(error.message);
  return { tags: data || [] };
}

export async function generatePostSeo(payload) {
  const supabase = requireSupabase();
  const { data, error } = await supabase.functions.invoke('generate-post-seo', { body: payload });
  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);
  return data;
}
