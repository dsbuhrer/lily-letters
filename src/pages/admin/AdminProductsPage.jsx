import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import { getCategoryLabel } from '../../data/productCategories';
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
      getCategoryLabel(p.category),
      p.subtitle,
    ]);
    return sortByKey(matched, sort, productComparators);
  }, [products, search, sort]);

  return (
    <div className="p-8">
      <div className="flex justify-between mb-8">
        <h1 className="font-display text-3xl text-wine">Products</h1>
        <Link to="/admin/products/new" className="btn-primary">
          Add product
        </Link>
      </div>

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

      <div className="bg-white/80 border border-taupe overflow-x-auto">
        <table className="w-full text-sm min-w-[480px]">
          <thead className="bg-cream border-b border-taupe">
            <tr>
              <th className="text-left p-4">ID</th>
              <th className="text-left p-4">Name</th>
              <th className="text-left p-4">Category</th>
              <th className="text-left p-4">Price</th>
              <th className="p-4" />
            </tr>
          </thead>
          <tbody>
            {filteredProducts.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-[#2d2020]/50">
                  {products.length === 0 ? 'No products yet.' : 'No products match your search.'}
                </td>
              </tr>
            ) : (
              filteredProducts.map((p) => (
                <tr key={p.id} className="border-b border-taupe/40">
                  <td className="p-4">{p.id}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      {p.images?.[0] && (
                        <img src={p.images[0]} alt="" className="w-10 h-10 object-cover border border-taupe/50" />
                      )}
                      {p.name}
                    </div>
                  </td>
                  <td className="p-4 text-[#2d2020]/70">{getCategoryLabel(p.category)}</td>
                  <td className="p-4">${p.price}</td>
                  <td className="p-4 text-right">
                    <div className="flex flex-wrap items-center justify-end gap-3">
                      {p.active !== false && (p.slug || p.id) && (
                        <a
                          href={`/products/${p.slug || p.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#2d2020]/70 text-xs font-medium hover:underline"
                        >
                          View
                        </a>
                      )}
                      <Link to={`/admin/products/${p.id}`} className="text-wine text-xs font-medium hover:underline">
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
