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
    <div className="p-8">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <h1 className="font-display text-3xl text-wine">Newsletter subscribers</h1>
        <a
          href="/api/subscribers/admin/export"
          className="btn-secondary inline-flex items-center gap-2"
          onClick={(e) => {
            e.preventDefault();
            window.open('/api/subscribers/admin/export', '_blank');
          }}
        >
          <Download size={16} />
          Export CSV
        </a>
      </div>

      <div className="flex flex-wrap items-center gap-4 mb-6">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#2d2020]/40 pointer-events-none" size={18} />
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
          <p className="text-sm text-[#2d2020]/60 ml-auto w-full sm:w-auto">
            {subscribers.length} {subscribers.length === 1 ? 'subscriber' : 'subscribers'}
          </p>
        )}
      </div>

      <div className="bg-white/80 border border-taupe overflow-hidden max-h-[60vh] overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="bg-cream border-b border-taupe sticky top-0">
            <tr>
              <th className="text-left p-4">Email</th>
              <th className="text-left p-4">Source</th>
              <th className="text-left p-4">Subscribed</th>
            </tr>
          </thead>
          <tbody>
            {sortedSubscribers.length === 0 ? (
              <tr>
                <td colSpan={3} className="p-8 text-center text-[#2d2020]/50">
                  No subscribers found.
                </td>
              </tr>
            ) : (
              sortedSubscribers.map((s) => (
                <tr key={s.id} className="border-b border-taupe/40">
                  <td className="p-4 font-medium">{s.email}</td>
                  <td className="p-4 capitalize">{s.source}</td>
                  <td className="p-4 text-[#2d2020]/60">{new Date(s.created_at).toLocaleString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
