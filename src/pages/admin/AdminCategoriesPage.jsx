import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import { useUiFeedback } from '../../context/UiFeedbackContext';
import AdminListToolbar from '../../components/admin/AdminListToolbar';
import { filterBySearch, sortByKey } from '../../utils/adminListFilter';

const SORT_OPTIONS = [
  { value: 'sort_asc', label: 'Sort order' },
  { value: 'name_asc', label: 'Name (A–Z)' },
  { value: 'name_desc', label: 'Name (Z–A)' },
];

const comparators = {
  sort_asc: (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || (a.name || '').localeCompare(b.name || ''),
  name_asc: (a, b) => (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' }),
  name_desc: (a, b) => (b.name || '').localeCompare(a.name || '', undefined, { sensitivity: 'base' }),
};

export default function AdminCategoriesPage() {
  const { confirm, toast } = useUiFeedback();
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('sort_asc');
  const [showArchived, setShowArchived] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api.admin
      .categories({ includeDeleted: true })
      .then((r) => setCategories(r.categories || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const visible = useMemo(() => {
    const active = showArchived ? categories : categories.filter((c) => !c.deleted_at);
    const matched = filterBySearch(active, search, (c) => [
      c.name,
      c.slug,
      c.description,
      c.meta_title,
    ]);
    return sortByKey(matched, sort, comparators);
  }, [categories, search, sort, showArchived]);

  const activeCount = categories.filter((c) => !c.deleted_at).length;

  const remove = async (cat) => {
    const ok = await confirm({
      title: 'Archive category?',
      message: `"${cat.name}" will be hidden from the blog and category picker. Posts already in this category keep their assignment.`,
      confirmLabel: 'Archive',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await api.admin.deleteCategory(cat.id);
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
          <h1 className="page-title">Post categories</h1>
          <p className="page-lead mt-1">Organize blog articles by topic</p>
        </div>
        <Link to="/admin/categories/new" className="btn-primary">
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
        searchPlaceholder="Search name, slug, description…"
        sort={sort}
        onSortChange={setSort}
        sortOptions={SORT_OPTIONS}
        filteredCount={visible.length}
        totalCount={showArchived ? categories.length : activeCount}
      />

      <div className="table-shell overflow-x-auto">
        <table className="data-table min-w-[520px]">
          <thead>
            <tr>
              <th>Order</th>
              <th>Name</th>
              <th>Slug</th>
              <th>Status</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="data-table-empty">
                  Loading…
                </td>
              </tr>
            ) : visible.length === 0 ? (
              <tr>
                <td colSpan={5} className="data-table-empty">
                  {categories.length === 0 ? 'No categories yet.' : 'No categories match your filters.'}
                </td>
              </tr>
            ) : (
              visible.map((c) => (
                <tr key={c.id} className={c.deleted_at ? 'opacity-60' : undefined}>
                  <td className="tabular-nums text-ink-subtle">{c.sort_order ?? 0}</td>
                  <td className="font-medium text-ink">{c.name}</td>
                  <td className="text-ink-muted font-mono text-xs">{c.slug}</td>
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
                          href={`/blog/category/${c.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="table-action-muted"
                        >
                          View
                        </a>
                      )}
                      {!c.deleted_at && (
                        <Link to={`/admin/categories/${c.id}`} className="table-action">
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
