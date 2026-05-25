import { useEffect, useState } from 'react';
import { products as staticProducts } from '../data/products';
import api from '../lib/api';

let cache = null;

export function useProducts() {
  const [products, setProducts] = useState(staticProducts);
  const [fromApi, setFromApi] = useState(false);

  useEffect(() => {
    if (cache) {
      setProducts(cache);
      setFromApi(true);
      return;
    }
    api
      .getProducts()
      .then((r) => {
        if (r.products?.length) {
          cache = r.products;
          setProducts(r.products);
          setFromApi(true);
        }
      })
      .catch(() => {});
  }, []);

  return { products, fromApi };
}

export function useProduct(idOrSlug) {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .getProduct(idOrSlug)
      .then((r) => setProduct(r.product))
      .catch(() => {
        const staticP = staticProducts.find(
          (p) => p.id === Number(idOrSlug) || String(p.id) === idOrSlug,
        );
        setProduct(staticP || null);
      })
      .finally(() => setLoading(false));
  }, [idOrSlug]);

  return { product, loading };
}
