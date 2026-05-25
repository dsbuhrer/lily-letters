import { categories } from './products';

/** Shop catalog categories (excludes "all") for CMS product form */
export const productCategories = categories.filter((c) => c.id !== 'all');

export function getCategoryLabel(id) {
  return productCategories.find((c) => c.id === id)?.label || id;
}
