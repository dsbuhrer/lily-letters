import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Tag, X } from 'lucide-react';
import api from '../../lib/api';
import { getCategoryLabel } from '../../data/productCategories';
import { useProductCategories } from '../../hooks/useProductCategories';
import { useUiFeedback } from '../../context/UiFeedbackContext';
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

function BulkSaleModal({ selectedCount, onClose, onApply, onEnd, loading }) {
  const [discountType, setDiscountType] = useState('percent');
  const [discountValue, setDiscountValue] = useState('20');

  const handleApply = () => {
    onApply({ discountType, discountValue: Number(discountValue) });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40">
      <div className="bg-cream w-full max-w-md shadow-panel border border-taupe/30 p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h2 className="font-display text-xl text-wine">Bulk promotion</h2>
            <p className="font-body text-sm text-ink-muted mt-1">
              {selectedCount} product{selectedCount === 1 ? '' : 's'} selected
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-ink-subtle hover:text-wine" aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs uppercase tracking-widest text-ink-subtle">Discount type</span>
              <select
                className="input-field mt-1"
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value)}
              >
                <option value="percent">Percent (%)</option>
                <option value="fixed">Fixed (USD)</option>
              </select>
            </label>
            <label className="block">
              <span className="text-xs uppercase tracking-widest text-ink-subtle">Value</span>
              <input
                className="input-field mt-1"
                type="number"
                min="0.01"
                step={discountType === 'percent' ? '1' : '0.01'}
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
              />
            </label>
          </div>

          <p className="font-body text-xs text-ink-subtle leading-relaxed">
            Applies a Sale badge and stores the previous price so you can end the promotion later without
            losing manual original prices.
          </p>

          <div className="flex flex-wrap gap-3 pt-2">
            <button type="button" className="btn-primary" disabled={loading} onClick={handleApply}>
              {loading ? 'Applying…' : 'Apply promotion'}
            </button>
            <button type="button" className="btn-ghost" disabled={loading} onClick={onEnd}>
              End promotion
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminProductsPage() {
  const { confirm, toast } = useUiFeedback();
  const { categories: productCategories } = useProductCategories();
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('name_asc');
  const [showInactive, setShowInactive] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [saleModalOpen, setSaleModalOpen] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);

  const load = () => api.admin.products().then((r) => setProducts(r.products || []));

  useEffect(() => {
    load();
  }, []);

  const activeCount = products.filter((p) => p.active !== false).length;

  const filteredProducts = useMemo(() => {
    const visible = showInactive ? products : products.filter((p) => p.active !== false);
    const matched = filterBySearch(visible, search, (p) => [
      p.name,
      p.sku,
      p.slug,
      String(p.id),
      getCategoryLabel(p.category, productCategories),
      p.subtitle,
    ]);
    return sortByKey(matched, sort, productComparators);
  }, [products, search, sort, productCategories, showInactive]);

  const selectedCount = selectedIds.size;
  const allVisibleSelected =
    filteredProducts.length > 0 && filteredProducts.every((p) => selectedIds.has(p.id));

  const toggleSelectAll = () => {
    if (allVisibleSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredProducts.map((p) => p.id)));
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const applyBulk = async ({ discountType, discountValue }) => {
    setBulkLoading(true);
    try {
      const result = await api.admin.bulkUpdateProducts({
        productIds: [...selectedIds],
        action: 'apply',
        discountType,
        discountValue,
      });
      await load();
      setSaleModalOpen(false);
      setSelectedIds(new Set());
      toast.success(`Promotion applied to ${result.count} product(s).`);
    } catch (e) {
      toast.error(e.message || 'Could not apply promotion.');
    } finally {
      setBulkLoading(false);
    }
  };

  const endBulk = async () => {
    const ok = await confirm({
      title: 'End bulk promotion?',
      message: 'Selected products will be restored to their pre-promotion prices.',
      confirmLabel: 'End promotion',
      variant: 'danger',
    });
    if (!ok) return;

    setBulkLoading(true);
    try {
      const result = await api.admin.bulkUpdateProducts({
        productIds: [...selectedIds],
        action: 'end',
      });
      await load();
      setSaleModalOpen(false);
      setSelectedIds(new Set());
      toast.success(`Promotion ended for ${result.count} product(s).`);
    } catch (e) {
      toast.error(e.message || 'Could not end promotion.');
    } finally {
      setBulkLoading(false);
    }
  };

  const remove = async (product) => {
    const ok = await confirm({
      title: 'Delete product?',
      message: product?.name
        ? `"${product.name}" will be removed from the shop (set to inactive). You can reactivate it later by editing the product.`
        : 'This product will be removed from the shop.',
      confirmLabel: 'Delete',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await api.admin.deleteProduct(product.id);
      setProducts((list) =>
        list.map((p) => (p.id === product.id ? { ...p, active: false } : p)),
      );
      toast.success('Product deleted.');
    } catch (e) {
      toast.error(e.message || 'Could not delete product.');
    }
  };

  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <h1 className="page-title">Products</h1>
        <Link to="/admin/products/new" className="btn-primary">
          Add product
        </Link>
      </header>

      <div className="flex flex-wrap items-center gap-4 mb-4">
        <label className="flex items-center gap-2 text-sm text-ink-muted cursor-pointer select-none">
          <input
            type="checkbox"
            className="accent-wine"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
          />
          Show inactive
        </label>
      </div>

      {selectedCount > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-3 p-3 bg-wine/5 border border-wine/15">
          <span className="font-body text-sm text-wine font-medium">
            {selectedCount} selected
          </span>
          <button type="button" className="btn-primary text-sm py-2" onClick={() => setSaleModalOpen(true)}>
            <Tag size={14} />
            Apply promotion
          </button>
          <button type="button" className="btn-ghost text-sm py-2" onClick={() => setSelectedIds(new Set())}>
            Clear selection
          </button>
        </div>
      )}

      <AdminListToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search name, SKU, ID, category, slug…"
        sort={sort}
        onSortChange={setSort}
        sortOptions={PRODUCT_SORT_OPTIONS}
        filteredCount={filteredProducts.length}
        totalCount={showInactive ? products.length : activeCount}
      />

      <div className="table-shell overflow-x-auto">
        <table className="data-table min-w-[480px]">
          <thead>
            <tr>
              <th className="w-10">
                <input
                  type="checkbox"
                  className="accent-wine"
                  checked={allVisibleSelected}
                  onChange={toggleSelectAll}
                  aria-label="Select all visible products"
                />
              </th>
              <th>ID</th>
              <th>SKU</th>
              <th>Name</th>
              <th>Category</th>
              <th>Price</th>
              <th>Status</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.length === 0 ? (
              <tr>
                <td colSpan={8} className="data-table-empty">
                  {products.length === 0 ? 'No products yet.' : 'No products match your search.'}
                </td>
              </tr>
            ) : (
              filteredProducts.map((p) => (
                <tr key={p.id} className={p.active === false ? 'opacity-60' : undefined}>
                  <td>
                    <input
                      type="checkbox"
                      className="accent-wine"
                      checked={selectedIds.has(p.id)}
                      onChange={() => toggleSelect(p.id)}
                      aria-label={`Select ${p.name}`}
                    />
                  </td>
                  <td className="tabular-nums text-ink-subtle">{p.id}</td>
                  <td className="font-mono text-xs text-ink-subtle tabular-nums">{p.sku || '—'}</td>
                  <td>
                    <div className="flex items-center gap-3">
                      {p.images?.[0] && (
                        <img src={p.images[0]} alt="" className="w-10 h-10 object-cover ring-1 ring-taupe/50" />
                      )}
                      <div>
                        <span className="font-medium text-ink">{p.name}</span>
                        {p.onSale && (
                          <span className="ml-2 badge bg-gold/15 text-wine border-gold/40 text-[10px]">
                            On sale
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>{getCategoryLabel(p.category, productCategories)}</td>
                  <td className="font-medium text-wine tabular-nums">
                    ${p.price}
                    {p.originalPrice && (
                      <span className="block text-xs text-ink-subtle line-through">${p.originalPrice}</span>
                    )}
                  </td>
                  <td>
                    {p.active === false ? (
                      <span className="badge bg-ink/[0.06] text-ink-muted border-taupe/60">Inactive</span>
                    ) : (
                      <span className="badge bg-sage/15 text-wine border-sage/40">Active</span>
                    )}
                  </td>
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
                      {p.active !== false && (
                        <button type="button" onClick={() => remove(p)} className="table-action-danger">
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {saleModalOpen && (
        <BulkSaleModal
          selectedCount={selectedCount}
          onClose={() => setSaleModalOpen(false)}
          onApply={applyBulk}
          onEnd={endBulk}
          loading={bulkLoading}
        />
      )}
    </div>
  );
}
