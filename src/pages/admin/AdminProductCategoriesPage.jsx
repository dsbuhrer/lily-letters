import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import { useUiFeedback } from '../../context/UiFeedbackContext';
import AdminListToolbar from '../../components/admin/AdminListToolbar';
import { filterBySearch, sortByKey } from '../../utils/adminListFilter';
import { invalidateProductCategoriesCache } from '../../hooks/useProductCategories';

const SORT_OPTIONS = [
  { value: 'sort_asc', label: 'Sort order' },
  { value: 'label_asc', label: 'Name (A–Z)' },
  { value: 'label_desc', label: 'Name (Z–A)' },
];

const comparators = {
  sort_asc: (a, b) =>
    (a.sort_order ?? 0) - (b.sort_order ?? 0) || (a.label || '').localeCompare(b.label || ''),
  label_asc: (a, b) => (a.label || '').localeCompare(b.label || '', undefined, { sensitivity: 'base' }),
  label_desc: (a, b) => (b.label || '').localeCompare(a.label || '', undefined, { sensitivity: 'base' }),
};

export default function AdminProductCategoriesPage() {
  const { confirm, toast } = useUiFeedback();
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('sort_asc');
  const [showArchived, setShowArchived] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api.admin
      .productCategories({ includeDeleted: true })
      .then((r) => setCategories(r.categories || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const visible = useMemo(() => {
    const active = showArchived ? categories : categories.filter((c) => !c.deleted_at);
    const matched = filterBySearch(active, search, (c) => [c.label, c.slug, c.group_name]);
    return sortByKey(matched, sort, comparators);
  }, [categories, search, sort, showArchived]);

  const activeCount = categories.filter((c) => !c.deleted_at).length;

  const remove = async (cat) => {
    const ok = await confirm({
      title: 'Archive product category?',
      message: `"${cat.label}" will be hidden from the shop filters and product form. Products already in this category keep their assignment.`,
      confirmLabel: 'Archive',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await api.admin.deleteProductCategory(cat.id);
      invalidateProductCategoriesCache();
      setCategories((list) =>
        list.map((c) => (c.id === cat.id ? { ...c, deleted_at: new Date().toISOString() } : c)),
      );
      toast.success('Category archived.');
    } catch (e) {
      toast.error(e.message || 'Could not archive category.');
    }
  };

  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <div>
          <h1 className="page-title">Product categories</h1>
          <p className="page-lead mt-1">Shop filters and product grouping</p>
        </div>
        <Link to="/admin/product-categories/new" className="btn-primary">
          Add category
        </Link>
      </header>

      <div className="flex flex-wrap items-center gap-4 mb-4">
        <label className="flex items-center gap-2 text-sm text-ink-muted cursor-pointer select-none">
          <input
            type="checkbox"
            className="accent-wine"
            checked={showArchived}
            onChange={(e) => setShowArchived(e.target.checked)}
          />
          Show archived
        </label>
      </div>

      <AdminListToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search label, slug, group…"
        sort={sort}
        onSortChange={setSort}
        sortOptions={SORT_OPTIONS}
        filteredCount={visible.length}
        totalCount={showArchived ? categories.length : activeCount}
      />

      <div className="table-shell overflow-x-auto">
        <table className="data-table min-w-[560px]">
          <thead>
            <tr>
              <th>Order</th>
              <th>Label</th>
              <th>Slug</th>
              <th>Group</th>
              <th>Status</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="data-table-empty">
                  Loading…
                </td>
              </tr>
            ) : visible.length === 0 ? (
              <tr>
                <td colSpan={6} className="data-table-empty">
                  {categories.length === 0 ? 'No categories yet.' : 'No categories match your filters.'}
                </td>
              </tr>
            ) : (
              visible.map((c) => (
                <tr key={c.id} className={c.deleted_at ? 'opacity-60' : undefined}>
                  <td className="tabular-nums text-ink-subtle">{c.sort_order ?? 0}</td>
                  <td className="font-medium text-ink">{c.label}</td>
                  <td className="text-ink-muted font-mono text-xs">{c.slug}</td>
                  <td className="text-ink-muted text-sm">{c.group_name || '—'}</td>
                  <td>
                    {c.deleted_at ? (
                      <span className="badge bg-ink/[0.06] text-ink-muted border-taupe/60">Archived</span>
                    ) : (
                      <span className="badge bg-sage/15 text-wine border-sage/40">Active</span>
                    )}
                  </td>
                  <td className="text-right">
                    <div className="flex flex-wrap items-center justify-end gap-x-4 gap-y-1">
                      {!c.deleted_at && (
                        <a
                          href={`/products?category=${encodeURIComponent(c.slug)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="table-action-muted"
                        >
                          View
                        </a>
                      )}
                      {!c.deleted_at && (
                        <Link to={`/admin/product-categories/${c.id}`} className="table-action">
                          Edit
                        </Link>
                      )}
                      {!c.deleted_at && (
                        <button type="button" className="table-action-danger" onClick={() => remove(c)}>
                          Archive
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
    </div>
  );
}
