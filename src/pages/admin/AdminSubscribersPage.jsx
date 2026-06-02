import { useEffect, useMemo, useState } from 'react';
import { Download, Search } from 'lucide-react';
import api from '../../lib/api';
import { sortByKey } from '../../utils/adminListFilter';

const SUBSCRIBER_SORT_OPTIONS = [
  { value: 'created_desc', label: 'Subscribed (newest)' },
  { value: 'created_asc', label: 'Subscribed (oldest)' },
  { value: 'email_asc', label: 'Email (A–Z)' },
  { value: 'email_desc', label: 'Email (Z–A)' },
];

const subscriberComparators = {
  created_desc: (a, b) => new Date(b.created_at) - new Date(a.created_at),
  created_asc: (a, b) => new Date(a.created_at) - new Date(b.created_at),
  email_asc: (a, b) => (a.email || '').localeCompare(b.email || '', undefined, { sensitivity: 'base' }),
  email_desc: (a, b) => (b.email || '').localeCompare(a.email || '', undefined, { sensitivity: 'base' }),
};

export default function AdminSubscribersPage() {
  const [subscribers, setSubscribers] = useState([]);
  const [q, setQ] = useState('');
  const [source, setSource] = useState('');
  const [sort, setSort] = useState('created_desc');

  const load = () => {
    const params = {};
    if (q) params.q = q;
    if (source) params.source = source;
    api.admin.subscribers(params).then((r) => setSubscribers(r.subscribers || []));
  };

  useEffect(() => {
    load();
  }, []);

  const sortedSubscribers = useMemo(
    () => sortByKey(subscribers, sort, subscriberComparators),
    [subscribers, sort],
  );

  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <h1 className="page-title">Newsletter subscribers</h1>
        <button
          type="button"
          className="btn-secondary inline-flex items-center gap-2"
          onClick={() => {
            const header = 'email,source,consent_at,created_at\n';
            const rows = sortedSubscribers
              .map(
                (s) =>
                  `${s.email},${s.source},${s.consent_at || ''},${s.created_at || ''}`,
              )
              .join('\n');
            const blob = new Blob([header + rows], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'subscribers.csv';
            a.click();
            URL.revokeObjectURL(url);
          }}
        >
          <Download size={16} />
          Export CSV
        </button>
      </header>

      <div className="flex flex-wrap items-center gap-4 mb-6">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint pointer-events-none" size={18} />
          <input
            type="search"
            className="input-field pl-10 w-full"
            placeholder="Search email…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && load()}
          />
        </div>
        <select className="input-field w-40" value={source} onChange={(e) => setSource(e.target.value)}>
          <option value="">All sources</option>
          <option value="footer">Footer</option>
          <option value="blog">Blog</option>
          <option value="checkout">Checkout</option>
        </select>
        <select className="input-field w-52" value={sort} onChange={(e) => setSort(e.target.value)}>
          {SUBSCRIBER_SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <button type="button" className="btn-primary" onClick={load}>
          Search
        </button>
        {subscribers.length > 0 && (
          <p className="text-sm text-ink-muted ml-auto w-full sm:w-auto">
            {subscribers.length} {subscribers.length === 1 ? 'subscriber' : 'subscribers'}
          </p>
        )}
      </div>

      <div className="table-shell max-h-[60vh] overflow-y-auto">
        <table className="data-table">
          <thead className="sticky top-0 z-[1]">
            <tr>
              <th>Email</th>
              <th>Source</th>
              <th>Subscribed</th>
            </tr>
          </thead>
          <tbody>
            {sortedSubscribers.length === 0 ? (
              <tr>
                <td colSpan={3} className="data-table-empty">
                  No subscribers found.
                </td>
              </tr>
            ) : (
              sortedSubscribers.map((s) => (
                <tr key={s.id}>
                  <td className="font-medium text-ink">{s.email}</td>
                  <td className="capitalize">{s.source}</td>
                  <td className="tabular-nums">{new Date(s.created_at).toLocaleString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
