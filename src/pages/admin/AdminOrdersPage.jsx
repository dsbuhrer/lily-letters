import { useEffect, useMemo, useState } from 'react';
import { ExternalLink, RefreshCw, RotateCcw, ShoppingBag, X } from 'lucide-react';
import api from '../../lib/api';
import { formatCents, formatOrderDate } from '../../lib/accountApi';
import { useUiFeedback } from '../../context/UiFeedbackContext';
import AdminListToolbar from '../../components/admin/AdminListToolbar';
import OrderStatusBadge from '../../components/account/OrderStatusBadge';
import { filterBySearch, sortByKey } from '../../utils/adminListFilter';

const ORDER_SORT_OPTIONS = [
  { value: 'created_desc', label: 'Newest first' },
  { value: 'created_asc', label: 'Oldest first' },
  { value: 'amount_desc', label: 'Amount (high–low)' },
  { value: 'amount_asc', label: 'Amount (low–high)' },
  { value: 'status', label: 'Status' },
];

const STATUS_FILTERS = [
  { value: '', label: 'All statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'paid', label: 'Paid' },
  { value: 'failed', label: 'Failed' },
  { value: 'refunded', label: 'Refunded' },
];

const orderComparators = {
  created_desc: (a, b) => new Date(b.created_at) - new Date(a.created_at),
  created_asc: (a, b) => new Date(a.created_at) - new Date(b.created_at),
  amount_desc: (a, b) => b.subtotal_cents - a.subtotal_cents,
  amount_asc: (a, b) => a.subtotal_cents - b.subtotal_cents,
  status: (a, b) =>
    a.status.localeCompare(b.status) || new Date(b.created_at) - new Date(a.created_at),
};

function formatBillingAddress(address) {
  if (!address || typeof address !== 'object') return '—';
  const parts = [
    address.street,
    [address.city, address.stateProvince].filter(Boolean).join(', '),
    address.postalCode,
    address.country,
  ].filter(Boolean);
  return parts.length ? parts.join(' · ') : '—';
}

function formatDateTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString();
}

export default function AdminOrdersPage() {
  const { confirm, toast } = useUiFeedback();
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('created_desc');
  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refunding, setRefunding] = useState(false);

  const load = () => {
    setLoading(true);
    const params = statusFilter ? { status: statusFilter } : {};
    api.admin
      .orders(params)
      .then((r) => setOrders(r.orders || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [statusFilter]);

  const filteredOrders = useMemo(() => {
    const matched = filterBySearch(orders, search, (order) => [
      order.order_number,
      order.email,
      order.billing_name,
      order.stripe_payment_intent_id,
      order.stripe_charge_id,
      ...(order.order_items || []).map((item) => item.product_name),
    ]);
    return sortByKey(matched, sort, orderComparators);
  }, [orders, search, sort]);

  const updateOrderInList = (updated) => {
    setOrders((list) => list.map((o) => (o.id === updated.id ? { ...o, ...updated } : o)));
    setSelected((current) => (current?.id === updated.id ? { ...current, ...updated } : current));
  };

  const handleRefund = async (order) => {
    const ok = await confirm({
      title: 'Refund order?',
      message: `Refund ${formatCents(order.subtotal_cents, order.currency)} for order ${order.order_number}? This will process a full refund via Stripe and cannot be undone.`,
      confirmLabel: 'Refund',
      variant: 'danger',
    });
    if (!ok) return;

    setRefunding(true);
    try {
      const { order: updated } = await api.admin.refundOrder(order.id);
      updateOrderInList(updated);
      toast.success('Order refunded successfully.');
    } catch (e) {
      toast.error(e.message || 'Refund failed.');
    } finally {
      setRefunding(false);
    }
  };

  const itemCount = (order) => order.order_items?.length || 0;

  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <div>
          <h1 className="page-title">Orders</h1>
          <p className="page-lead mt-1">All purchases made through the site</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-ink-muted">
            <span className="sr-only">Filter by status</span>
            <select
              className="input-field w-44"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              {STATUS_FILTERS.map((opt) => (
                <option key={opt.value || 'all'} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
          <button type="button" className="btn-ghost text-sm gap-2" onClick={load} disabled={loading}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </header>

      <AdminListToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search order #, email, name, product…"
        sort={sort}
        onSortChange={setSort}
        sortOptions={ORDER_SORT_OPTIONS}
        filteredCount={filteredOrders.length}
        totalCount={orders.length}
      />

      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2 table-shell">
          {loading ? (
            <p className="data-table-empty">Loading…</p>
          ) : filteredOrders.length === 0 ? (
            <p className="data-table-empty">
              {orders.length === 0 ? 'No orders yet.' : 'No orders match your filters.'}
            </p>
          ) : (
            <ul className="divide-y divide-taupe/35 max-h-[70vh] overflow-y-auto">
              {filteredOrders.map((order) => (
                <li key={order.id}>
                  <button
                    type="button"
                    onClick={() => setSelected(order)}
                    className={`w-full text-left p-4 transition-colors duration-150 hover:bg-cream/60 focus-visible:bg-cream/80 ${
                      selected?.id === order.id ? 'bg-cream/90 ring-1 ring-inset ring-gold/25' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium text-wine truncate">{order.order_number}</p>
                        <p className="text-xs text-ink-subtle truncate">{order.email}</p>
                      </div>
                      <OrderStatusBadge status={order.status} />
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-2">
                      <p className="text-sm font-medium text-ink">
                        {formatCents(order.subtotal_cents, order.currency)}
                      </p>
                      <p className="text-xs text-ink-faint">
                        {itemCount(order)} {itemCount(order) === 1 ? 'item' : 'items'}
                      </p>
                    </div>
                    <p className="text-xs text-ink-faint mt-1">
                      {new Date(order.created_at).toLocaleString()}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="lg:col-span-3 panel min-h-[320px] flex flex-col">
          {!selected ? (
            <div className="flex-1 flex flex-col items-center justify-center p-10 text-center text-ink-subtle">
              <ShoppingBag className="mb-3 text-gold" size={32} strokeWidth={1.25} />
              <p className="text-sm">Select an order to view details</p>
            </div>
          ) : (
            <div className="panel-padding flex-1 overflow-y-auto">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
                <div>
                  <h2 className="font-display text-2xl text-wine">{selected.order_number}</h2>
                  <p className="text-sm text-ink-muted mt-1">
                    Placed {formatOrderDate(selected.created_at)}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <OrderStatusBadge status={selected.status} />
                  {selected.status === 'paid' && (
                    <button
                      type="button"
                      className="btn-secondary text-xs py-1.5 gap-1.5 text-red-800 border-red-200/80 hover:bg-red-50"
                      onClick={() => handleRefund(selected)}
                      disabled={refunding}
                    >
                      <RotateCcw size={14} />
                      {refunding ? 'Refunding…' : 'Refund'}
                    </button>
                  )}
                  <button
                    type="button"
                    className="icon-btn"
                    aria-label="Close"
                    onClick={() => setSelected(null)}
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4 mb-6">
                <div className="p-4 bg-cream/60 border border-taupe/40 rounded-sm">
                  <p className="form-label mb-1">Total</p>
                  <p className="font-display text-2xl text-wine">
                    {formatCents(selected.subtotal_cents, selected.currency)}
                  </p>
                </div>
                <div className="p-4 bg-cream/60 border border-taupe/40 rounded-sm">
                  <p className="form-label mb-1">Items</p>
                  <p className="font-display text-2xl text-wine">{itemCount(selected)}</p>
                </div>
              </div>

              <dl className="space-y-4 text-sm mb-8">
                <div>
                  <dt className="form-label mb-0">Customer email</dt>
                  <dd className="mt-1">
                    <a
                      href={`mailto:${selected.email}`}
                      className="text-gold hover:text-wine hover:underline underline-offset-2 transition-colors"
                    >
                      {selected.email}
                    </a>
                  </dd>
                </div>
                <div>
                  <dt className="form-label mb-0">Billing name</dt>
                  <dd className="mt-1 text-ink-muted">{selected.billing_name || '—'}</dd>
                </div>
                <div>
                  <dt className="form-label mb-0">Billing address</dt>
                  <dd className="mt-1 text-ink-muted">
                    {formatBillingAddress(selected.billing_address)}
                  </dd>
                </div>
                <div>
                  <dt className="form-label mb-0">Account</dt>
                  <dd className="mt-1 text-ink-muted">
                    {selected.user_id ? 'Linked to customer account' : 'Guest checkout'}
                  </dd>
                </div>
                <div>
                  <dt className="form-label mb-0">Payment provider</dt>
                  <dd className="mt-1 text-ink-muted capitalize">{selected.payment_provider || '—'}</dd>
                </div>
                <div>
                  <dt className="form-label mb-0">Paid at</dt>
                  <dd className="mt-1 text-ink-muted">{formatDateTime(selected.paid_at)}</dd>
                </div>
                <div>
                  <dt className="form-label mb-0">Created</dt>
                  <dd className="mt-1 text-ink-muted">{formatDateTime(selected.created_at)}</dd>
                </div>
                <div>
                  <dt className="form-label mb-0">Last updated</dt>
                  <dd className="mt-1 text-ink-muted">{formatDateTime(selected.updated_at)}</dd>
                </div>
                {selected.stripe_payment_intent_id && (
                  <div>
                    <dt className="form-label mb-0">Stripe Payment Intent</dt>
                    <dd className="mt-1">
                      <a
                        href={`https://dashboard.stripe.com/payments/${selected.stripe_payment_intent_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-gold hover:text-wine hover:underline underline-offset-2 transition-colors break-all"
                      >
                        {selected.stripe_payment_intent_id}
                        <ExternalLink size={12} className="shrink-0" />
                      </a>
                    </dd>
                  </div>
                )}
                {selected.stripe_charge_id && (
                  <div>
                    <dt className="form-label mb-0">Stripe Charge</dt>
                    <dd className="mt-1 text-ink-muted break-all font-mono text-xs">
                      {selected.stripe_charge_id}
                    </dd>
                  </div>
                )}
              </dl>

              <h3 className="form-label mb-3">Order items</h3>
              <div className="space-y-2">
                {(selected.order_items || []).map((item) => (
                  <div
                    key={item.id}
                    className="p-4 bg-cream/80 border border-taupe/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-ink">{item.product_name}</p>
                      <p className="text-xs text-ink-subtle mt-0.5">
                        {item.product_slug ? `/${item.product_slug}` : '—'}
                        {item.product_id ? ` · ID ${item.product_id}` : ''}
                      </p>
                      <p className="text-xs text-ink-faint mt-1">
                        {item.pdf_url
                          ? 'PDF download'
                          : item.canva_link
                            ? 'Canva template'
                            : 'Digital product'}
                      </p>
                    </div>
                    <p className="text-sm font-medium text-wine shrink-0">
                      {formatCents(item.price_cents, selected.currency)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
