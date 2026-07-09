import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import { useUiFeedback } from '../../context/UiFeedbackContext';
import AdminListToolbar from '../../components/admin/AdminListToolbar';
import { filterBySearch, sortByKey } from '../../utils/adminListFilter';

const SORT_OPTIONS = [
  { value: 'code_asc', label: 'Code (A–Z)' },
  { value: 'code_desc', label: 'Code (Z–A)' },
  { value: 'created_desc', label: 'Newest' },
  { value: 'created_asc', label: 'Oldest' },
];

const comparators = {
  code_asc: (a, b) => (a.code || '').localeCompare(b.code || ''),
  code_desc: (a, b) => (b.code || '').localeCompare(a.code || ''),
  created_desc: (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
  created_asc: (a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0),
};

function formatDiscount(coupon) {
  if (coupon.discountType === 'percent') return `${coupon.discountValue}%`;
  return `$${Number(coupon.discountValue).toFixed(2)}`;
}

export default function AdminCouponsPage() {
  const { confirm, toast } = useUiFeedback();
  const [coupons, setCoupons] = useState([]);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('created_desc');
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api.admin
      .coupons()
      .then((r) => setCoupons(r.coupons || []))
      .catch((e) => toast.error(e.message || 'Could not load coupons.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const matched = filterBySearch(coupons, search, (c) => [
      c.code,
      c.description,
      c.scope,
      c.discountType,
    ]);
    return sortByKey(matched, sort, comparators);
  }, [coupons, search, sort]);

  const remove = async (coupon) => {
    const ok = await confirm({
      title: 'Delete coupon?',
      message: `"${coupon.code}" will be permanently removed.`,
      confirmLabel: 'Delete',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await api.admin.deleteCoupon(coupon.id);
      setCoupons((list) => list.filter((c) => c.id !== coupon.id));
      toast.success('Coupon deleted.');
    } catch (e) {
      toast.error(e.message || 'Could not delete coupon.');
    }
  };

  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <div>
          <h1 className="page-title">Coupons</h1>
          <p className="page-lead mt-1">Checkout discount codes for cart or selected products</p>
        </div>
        <Link to="/admin/coupons/new" className="btn-primary">
          Add coupon
        </Link>
      </header>

      <AdminListToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search code, description…"
        sort={sort}
        onSortChange={setSort}
        sortOptions={SORT_OPTIONS}
        filteredCount={filtered.length}
        totalCount={coupons.length}
      />

      <div className="table-shell overflow-x-auto">
        <table className="data-table min-w-[640px]">
          <thead>
            <tr>
              <th>Code</th>
              <th>Discount</th>
              <th>Scope</th>
              <th>Usage</th>
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
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="data-table-empty">
                  {coupons.length === 0 ? 'No coupons yet.' : 'No coupons match your search.'}
                </td>
              </tr>
            ) : (
              filtered.map((c) => (
                <tr key={c.id}>
                  <td>
                    <span className="font-mono font-medium text-wine">{c.code}</span>
                    {c.description && (
                      <span className="block text-xs text-ink-subtle mt-0.5">{c.description}</span>
                    )}
                  </td>
                  <td className="tabular-nums">{formatDiscount(c)}</td>
                  <td>
                    {c.scope === 'products'
                      ? `${c.productIds?.length || 0} product(s)`
                      : 'Entire cart'}
                  </td>
                  <td className="tabular-nums text-ink-subtle">
                    {c.timesRedeemed}
                    {c.maxRedemptions != null ? ` / ${c.maxRedemptions}` : ''}
                  </td>
                  <td>
                    {c.active ? (
                      <span className="badge bg-sage/15 text-wine border-sage/40">Active</span>
                    ) : (
                      <span className="badge bg-ink/[0.06] text-ink-muted border-taupe/60">Inactive</span>
                    )}
                  </td>
                  <td className="text-right">
                    <div className="flex flex-wrap items-center justify-end gap-x-4 gap-y-1">
                      <Link to={`/admin/coupons/${c.id}`} className="table-action">
                        Edit
                      </Link>
                      <button type="button" onClick={() => remove(c)} className="table-action-danger">
                        Delete
                      </button>
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
