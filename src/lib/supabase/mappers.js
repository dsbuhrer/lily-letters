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
  return {
    ...row,
    category: cat
      ? { id: cat.id, slug: cat.slug, name: cat.name }
      : null,
  };
}
