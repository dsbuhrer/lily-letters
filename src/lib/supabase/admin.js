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
  const [drafts, published, subs, contacts, contactsUnread, orders, ordersPaid] = await Promise.all([
    supabase.from('posts').select('id', { count: 'exact', head: true }).eq('status', 'draft'),
    supabase.from('posts').select('id', { count: 'exact', head: true }).eq('status', 'published'),
    supabase.from('subscribers').select('id', { count: 'exact', head: true }).is('unsubscribed_at', null),
    supabase.from('contacts').select('id', { count: 'exact', head: true }),
    supabase.from('contacts').select('id', { count: 'exact', head: true }).is('read_at', null),
    supabase.from('orders').select('id', { count: 'exact', head: true }),
    supabase.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'paid'),
  ]);
  return {
    drafts: drafts.count || 0,
    published: published.count || 0,
    subscribers: subs.count || 0,
    contacts: contacts.count || 0,
    contacts_unread: contactsUnread.count || 0,
    orders: orders.count || 0,
    orders_paid: ordersPaid.count || 0,
  };
}

const ORDER_SELECT = `
  id,
  order_number,
  email,
  user_id,
  status,
  subtotal_cents,
  currency,
  payment_provider,
  stripe_payment_intent_id,
  stripe_charge_id,
  paid_at,
  billing_name,
  billing_address,
  created_at,
  updated_at,
  order_items (
    id,
    product_id,
    product_name,
    product_slug,
    price_cents,
    canva_link,
    pdf_url,
    pdf_file_name
  )
`;

export async function listOrders(params = {}) {
  const supabase = requireSupabase();
  let query = supabase.from('orders').select(ORDER_SELECT).order('created_at', { ascending: false });
  if (params.status) query = query.eq('status', params.status);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return { orders: data || [] };
}

export async function refundOrder(orderId) {
  const supabase = requireSupabase();
  const { data, error } = await supabase.functions.invoke('refund-order', {
    body: { orderId },
  });
  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);
  return data;
}

export async function listReviews() {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from('product_reviews')
    .select(
      `
      id,
      rating,
      body,
      author_name,
      author_email,
      created_at,
      product_id,
      order_id,
      products ( id, name, slug ),
      orders ( id, order_number )
    `,
    )
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return {
    reviews: (data || []).map((row) => ({
      id: row.id,
      rating: row.rating,
      body: row.body,
      authorName: row.author_name,
      authorEmail: row.author_email,
      createdAt: row.created_at,
      productId: row.product_id,
      productName: row.products?.name || `Product #${row.product_id}`,
      productSlug: row.products?.slug || null,
      orderId: row.order_id,
      orderNumber: row.orders?.order_number || null,
    })),
  };
}

export async function deleteReview(id) {
  const supabase = requireSupabase();
  const { error } = await supabase.from('product_reviews').delete().eq('id', id);
  if (error) throw new Error(error.message);
  return { ok: true };
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
  const sku = body.sku?.trim() || null;
  const row = {
    name: body.name,
    slug: body.slug || slugify(body.name),
    sku,
    subtitle: body.subtitle,
    category: body.category,
    price: body.price,
    original_price: body.original_price,
    badge: body.badge,
    description: body.description,
    includes: body.includes,
    canva_link: body.canva_link,
    pdf_url: body.pdf_url ?? null,
    pdf_file_name: body.pdf_file_name?.trim() || null,
    images: body.images,
    videos: body.videos ?? [],
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

function roundPrice(value) {
  return Math.max(0.01, Math.round(value * 100) / 100);
}

function applyBulkSaleRow(product, discountType, discountValue) {
  const currentPrice = Number(product.price);
  const currentOriginal = product.original_price != null ? Number(product.original_price) : null;
  const currentBadge = product.badge || null;
  const onSale = product.on_sale === true;

  let preSaleState = product.pre_sale_state;
  let basePrice;

  if (!onSale) {
    preSaleState = { price: currentPrice, original_price: currentOriginal, badge: currentBadge };
    basePrice = currentPrice;
  } else {
    basePrice = Number(preSaleState?.price ?? currentPrice);
  }

  let newPrice;
  if (discountType === 'percent') {
    newPrice = roundPrice(basePrice * (1 - Number(discountValue) / 100));
  } else {
    newPrice = roundPrice(basePrice - Number(discountValue));
  }

  return {
    price: newPrice,
    original_price: basePrice,
    badge: 'Sale',
    on_sale: true,
    pre_sale_state: preSaleState,
    updated_at: new Date().toISOString(),
  };
}

function endBulkSaleRow(product) {
  if (!product.on_sale || !product.pre_sale_state) return null;
  const snap = product.pre_sale_state;
  return {
    price: snap.price,
    original_price: snap.original_price ?? null,
    badge: snap.badge ?? null,
    on_sale: false,
    pre_sale_state: null,
    updated_at: new Date().toISOString(),
  };
}

export async function bulkUpdateProducts({ productIds, action, discountType, discountValue }) {
  const supabase = requireSupabase();
  const ids = (productIds || []).map((id) => Number(id)).filter((id) => Number.isFinite(id) && id > 0);
  if (!ids.length) throw new Error('Select at least one product.');

  const { data: products, error: fetchError } = await supabase.from('products').select('*').in('id', ids);
  if (fetchError) throw new Error(fetchError.message);

  const updated = [];
  for (const product of products || []) {
    let row;
    if (action === 'end') {
      row = endBulkSaleRow(product);
      if (!row) continue;
    } else if (action === 'apply') {
      if (!discountType || !['percent', 'fixed'].includes(discountType)) {
        throw new Error('Select a valid discount type.');
      }
      const value = Number(discountValue);
      if (!Number.isFinite(value) || value <= 0) throw new Error('Enter a valid discount value.');
      if (discountType === 'percent' && value >= 100) {
        throw new Error('Percent discount must be less than 100%.');
      }
      row = applyBulkSaleRow(product, discountType, value);
    } else {
      throw new Error('Invalid bulk action.');
    }

    const { data, error } = await supabase.from('products').update(row).eq('id', product.id).select().single();
    if (error) throw new Error(error.message);
    updated.push(mapProduct(data));
  }

  return { products: updated, count: updated.length };
}

function mapCoupon(row, productIds = []) {
  if (!row) return null;
  return {
    id: row.id,
    code: row.code,
    description: row.description || '',
    discountType: row.discount_type,
    discountValue: Number(row.discount_value),
    scope: row.scope,
    minSubtotalCents: row.min_subtotal_cents,
    maxRedemptions: row.max_redemptions,
    timesRedeemed: row.times_redeemed ?? 0,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    active: row.active !== false,
    productIds,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listCoupons() {
  const supabase = requireSupabase();
  const { data, error } = await supabase.from('coupons').select('*').order('created_at', { ascending: false });
  if (error) throw new Error(error.message);

  const coupons = data || [];
  if (!coupons.length) return { coupons: [] };

  const { data: links, error: linksError } = await supabase
    .from('coupon_products')
    .select('coupon_id, product_id')
    .in(
      'coupon_id',
      coupons.map((c) => c.id),
    );
  if (linksError) throw new Error(linksError.message);

  const productsByCoupon = (links || []).reduce((acc, link) => {
    if (!acc[link.coupon_id]) acc[link.coupon_id] = [];
    acc[link.coupon_id].push(link.product_id);
    return acc;
  }, {});

  return {
    coupons: coupons.map((c) => mapCoupon(c, productsByCoupon[c.id] || [])),
  };
}

export async function getCoupon(id) {
  const supabase = requireSupabase();
  const { data, error } = await supabase.from('coupons').select('*').eq('id', id).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error('Coupon not found');

  const { data: links, error: linksError } = await supabase
    .from('coupon_products')
    .select('product_id')
    .eq('coupon_id', id);
  if (linksError) throw new Error(linksError.message);

  return {
    coupon: mapCoupon(
      data,
      (links || []).map((l) => l.product_id),
    ),
  };
}

export async function saveCoupon(body, id) {
  const supabase = requireSupabase();
  const code = String(body.code || '')
    .trim()
    .toUpperCase();
  if (!code) throw new Error('Coupon code is required.');

  const row = {
    code,
    description: body.description?.trim() || null,
    discount_type: body.discountType,
    discount_value: Number(body.discountValue),
    scope: body.scope || 'cart',
    min_subtotal_cents: body.minSubtotalCents != null ? Number(body.minSubtotalCents) : null,
    max_redemptions: body.maxRedemptions != null ? Number(body.maxRedemptions) : null,
    starts_at: body.startsAt || null,
    ends_at: body.endsAt || null,
    active: body.active !== false,
    updated_at: new Date().toISOString(),
  };

  let couponId = id;
  if (id) {
    const { data, error } = await supabase.from('coupons').update(row).eq('id', id).select().single();
    if (error) throw new Error(error.message);
    couponId = data.id;
  } else {
    const { data, error } = await supabase.from('coupons').insert(row).select().single();
    if (error) throw new Error(error.message);
    couponId = data.id;
  }

  await supabase.from('coupon_products').delete().eq('coupon_id', couponId);

  if (row.scope === 'products' && Array.isArray(body.productIds) && body.productIds.length) {
    const productIds = body.productIds.map((pid) => Number(pid)).filter((pid) => Number.isFinite(pid) && pid > 0);
    if (productIds.length) {
      const { error: linkError } = await supabase.from('coupon_products').insert(
        productIds.map((product_id) => ({ coupon_id: couponId, product_id })),
      );
      if (linkError) throw new Error(linkError.message);
    }
  }

  return getCoupon(couponId);
}

export async function deleteCoupon(id) {
  const supabase = requireSupabase();
  const { error } = await supabase.from('coupons').delete().eq('id', id);
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
