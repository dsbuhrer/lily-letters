import { requireSupabase } from './client';
import { mapProduct } from './mappers';
import { sanitizePostContent } from '../sanitizePostHtml';
import { slugify, readingTime } from '../utils/slug';

function preparePostRow(body, existingSlug) {
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
    tag_slugs: body.tag_slugs,
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
  const row = preparePostRow(body, existing?.slug);
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

export async function listCategories() {
  const supabase = requireSupabase();
  const { data, error } = await supabase.from('categories').select('*').order('sort_order');
  if (error) throw new Error(error.message);
  return { categories: data || [] };
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

export async function saveProduct(body, id) {
  const supabase = requireSupabase();
  const row = {
    name: body.name,
    slug: body.slug || slugify(body.name),
    etsy_id: body.etsy_id,
    etsy_url: body.etsy_url,
    subtitle: body.subtitle,
    category: body.category,
    price: body.price,
    original_price: body.original_price,
    badge: body.badge,
    description: body.description,
    includes: body.includes,
    canva_link: body.canva_link,
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
  const { data, error } = await supabase.from('products').insert(row).select().single();
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

export async function generatePostSeo(payload) {
  const supabase = requireSupabase();
  const { data, error } = await supabase.functions.invoke('generate-post-seo', { body: payload });
  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);
  return data;
}
