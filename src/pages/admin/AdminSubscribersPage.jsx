import { useEffect, useState } from 'react';
import { Download, Search } from 'lucide-react';
import api from '../../lib/api';

export default function AdminSubscribersPage() {
  const [subscribers, setSubscribers] = useState([]);
  const [q, setQ] = useState('');
  const [source, setSource] = useState('');

  const load = () => {
    const params = {};
    if (q) params.q = q;
    if (source) params.source = source;
    api.admin.subscribers(params).then((r) => setSubscribers(r.subscribers || []));
  };

  useEffect(() => {
    load();
  }, []);

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

      <div className="flex flex-wrap gap-4 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#2d2020]/40" size={18} />
          <input
            className="input-field pl-10"
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
        <button type="button" className="btn-primary" onClick={load}>
          Filter
        </button>
      </div>

      <p className="text-sm text-[#2d2020]/60 mb-4">{subscribers.length} active subscribers</p>

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
            {subscribers.map((s) => (
              <tr key={s.id} className="border-b border-taupe/40">
                <td className="p-4 font-medium">{s.email}</td>
                <td className="p-4 capitalize">{s.source}</td>
                <td className="p-4 text-[#2d2020]/60">
                  {new Date(s.created_at).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
