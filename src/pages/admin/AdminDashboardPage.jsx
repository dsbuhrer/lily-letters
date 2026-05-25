import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.admin.stats().then(setStats).catch(console.error);
  }, []);

  return (
    <div className="p-8">
      <h1 className="font-display text-3xl text-wine mb-8">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {[
          { label: 'Draft posts', value: stats?.drafts ?? '—' },
          { label: 'Published', value: stats?.published ?? '—' },
          { label: 'Subscribers', value: stats?.subscribers ?? '—' },
        ].map((s) => (
          <div key={s.label} className="bg-white/80 border border-taupe p-6">
            <p className="text-xs uppercase tracking-widest text-[#2d2020]/50">{s.label}</p>
            <p className="font-display text-4xl text-wine mt-2">{s.value}</p>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-4">
        <Link to="/admin/posts/new" className="btn-primary">
          New post
        </Link>
        <Link to="/admin/products" className="btn-secondary">
          Manage products
        </Link>
        <Link to="/admin/subscribers" className="btn-ghost">
          View subscribers
        </Link>
      </div>
    </div>
  );
}
