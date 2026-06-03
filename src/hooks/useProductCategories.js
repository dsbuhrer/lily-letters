import { useEffect, useMemo, useState } from 'react';
import api from '../lib/api';
import {
  buildGroupedProductCategories,
  groupCategoriesForSelect,
  staticProductCategories,
} from '../lib/productCategoryUtils';

let cache = null;

export function invalidateProductCategoriesCache() {
  cache = null;
}

export function useProductCategories() {
  const [categories, setCategories] = useState(cache || staticProductCategories);
  const [fromApi, setFromApi] = useState(!!cache);

  useEffect(() => {
    if (cache) {
      setCategories(cache);
      setFromApi(true);
      return;
    }
    api
      .getProductCategories()
      .then((r) => {
        if (r.categories?.length) {
          cache = r.categories;
          setCategories(r.categories);
          setFromApi(true);
        }
      })
      .catch(() => {});
  }, []);

  const grouped = useMemo(() => buildGroupedProductCategories(categories), [categories]);
  const groupedForSelect = useMemo(() => groupCategoriesForSelect(categories), [categories]);

  return { categories, grouped, groupedForSelect, fromApi };
}
