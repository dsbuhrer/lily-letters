import { slugify, readingTime } from '../utils/slug';

function normalizeFaq(faq) {
  if (!faq) return [];
  let parsed = faq;
  if (typeof faq === 'string') {
    try {
      parsed = JSON.parse(faq);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(parsed)) return [];
  return parsed.filter((item) => item?.question?.trim() && item?.answer?.trim());
}

function normalizeTagSlugs(tagSlugs) {
  if (!Array.isArray(tagSlugs)) return [];
  return tagSlugs
    .map((raw) => {
      const name = String(raw).trim();
      if (!name) return null;
      return { slug: slugify(name), name };
    })
    .filter(Boolean);
}

function normalizeRelatedProductIds(ids) {
  if (!Array.isArray(ids)) return [];
  return ids
    .map((id) => (typeof id === 'string' ? parseInt(id, 10) : Number(id)))
    .filter((id) => Number.isFinite(id) && id > 0);
}

export function mapProduct(row) {
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
    badge: row.badge === 'Low Stock' ? null : row.badge,
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

export function mapPost(row, category) {
  if (!row) return null;
  const cat = category || row.categories;
  const content = row.content || '';
  const faq = normalizeFaq(row.faq);
  const tags = normalizeTagSlugs(row.tag_slugs);
  const related_product_ids = normalizeRelatedProductIds(row.related_product_ids);

  return {
    ...row,
    content,
    faq,
    tags,
    tag_slugs: tags.map((t) => t.name),
    related_product_ids,
    reading_time_minutes:
      row.reading_time_minutes ||
      readingTime(content) ||
      1,
    category: cat
      ? { id: cat.id, slug: cat.slug, name: cat.name }
      : null,
  };
}
