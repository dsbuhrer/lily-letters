import { categories as staticCategories } from '../data/products';

/** @typedef {{ id?: string, slug: string, label: string, group_name?: string | null, group?: string | null, sort_order?: number }} ProductCategory */

export const staticProductCategories = staticCategories.filter((c) => c.id !== 'all');

export function normalizeProductCategory(row) {
  if (!row) return null;
  const slug = row.slug || row.id;
  return {
    id: row.id,
    slug,
    label: row.label,
    group_name: row.group_name ?? row.group ?? null,
  };
}

export function getCategoryLabel(slug, categories = staticProductCategories) {
  const list = categories?.length ? categories : staticProductCategories;
  const match = list.find((c) => (c.slug || c.id) === slug);
  return match?.label || slug?.replace(/-/g, ' ') || slug;
}

/** Sidebar / select structure with virtual "all" entry */
export function buildGroupedProductCategories(categories = staticProductCategories) {
  const list = categories?.length ? categories : staticProductCategories;
  const groups = [];
  const seen = new Set();

  groups.push({ type: 'item', id: 'all', slug: 'all', label: 'All Templates', group_name: null });

  list.forEach((raw) => {
    const cat = normalizeProductCategory(raw);
    if (!cat) return;
    const group = cat.group_name;
    if (group && !seen.has(group)) {
      seen.add(group);
      groups.push({ type: 'group', label: group });
    }
    groups.push({
      type: 'item',
      id: cat.slug,
      slug: cat.slug,
      label: cat.label,
      group_name: group,
    });
  });

  return groups;
}

export function groupCategoriesForSelect(categories = staticProductCategories) {
  const list = categories?.length ? categories : staticProductCategories;
  return list.reduce((acc, raw) => {
    const cat = normalizeProductCategory(raw);
    if (!cat) return acc;
    const g = cat.group_name || 'Other';
    if (!acc[g]) acc[g] = [];
    acc[g].push(cat);
    return acc;
  }, {});
}
