import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import { getCategoryLabel } from '../../data/productCategories';
import { useProductCategories } from '../../hooks/useProductCategories';
import AdminListToolbar from '../../components/admin/AdminListToolbar';
import { filterBySearch, sortByKey } from '../../utils/adminListFilter';

const PRODUCT_SORT_OPTIONS = [
  { value: 'name_asc', label: 'Name (A–Z)' },
  { value: 'name_desc', label: 'Name (Z–A)' },
  { value: 'price_asc', label: 'Price (low–high)' },
  { value: 'price_desc', label: 'Price (high–low)' },
  { value: 'id_desc', label: 'ID (newest)' },
  { value: 'id_asc', label: 'ID (oldest)' },
];

const productComparators = {
  name_asc: (a, b) => (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' }),
  name_desc: (a, b) => (b.name || '').localeCompare(a.name || '', undefined, { sensitivity: 'base' }),
  price_asc: (a, b) => (a.price ?? 0) - (b.price ?? 0),
  price_desc: (a, b) => (b.price ?? 0) - (a.price ?? 0),
  id_asc: (a, b) => a.id - b.id,
  id_desc: (a, b) => b.id - a.id,
};

export default function AdminProductsPage() {
  const { categories: productCategories } = useProductCategories();
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('name_asc');

  const load = () => api.admin.products().then((r) => setProducts(r.products || []));

  useEffect(() => {
    load();
  }, []);

  const filteredProducts = useMemo(() => {
    const matched = filterBySearch(products, search, (p) => [
      p.name,
      p.slug,
      String(p.id),
      getCategoryLabel(p.category, productCategories),
      p.subtitle,
    ]);
    return sortByKey(matched, sort, productComparators);
  }, [products, search, sort, productCategories]);

  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <h1 className="page-title">Products</h1>
        <Link to="/admin/products/new" className="btn-primary">
          Add product
        </Link>
      </header>

      <AdminListToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search name, ID, category, slug…"
        sort={sort}
        onSortChange={setSort}
        sortOptions={PRODUCT_SORT_OPTIONS}
        filteredCount={filteredProducts.length}
        totalCount={products.length}
      />

      <div className="table-shell overflow-x-auto">
        <table className="data-table min-w-[480px]">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Category</th>
              <th>Price</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.length === 0 ? (
              <tr>
                <td colSpan={5} className="data-table-empty">
                  {products.length === 0 ? 'No products yet.' : 'No products match your search.'}
                </td>
              </tr>
            ) : (
              filteredProducts.map((p) => (
                <tr key={p.id}>
                  <td className="tabular-nums text-ink-subtle">{p.id}</td>
                  <td>
                    <div className="flex items-center gap-3">
                      {p.images?.[0] && (
                        <img src={p.images[0]} alt="" className="w-10 h-10 object-cover ring-1 ring-taupe/50" />
                      )}
                      <span className="font-medium text-ink">{p.name}</span>
                    </div>
                  </td>
                  <td>{getCategoryLabel(p.category, productCategories)}</td>
                  <td className="font-medium text-wine tabular-nums">${p.price}</td>
                  <td className="text-right">
                    <div className="flex flex-wrap items-center justify-end gap-x-4 gap-y-1">
                      {p.active !== false && (p.slug || p.id) && (
                        <a
                          href={`/products/${p.slug || p.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="table-action-muted"
                        >
                          View
                        </a>
                      )}
                      <Link to={`/admin/products/${p.id}`} className="table-action">
                        Edit
                      </Link>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
