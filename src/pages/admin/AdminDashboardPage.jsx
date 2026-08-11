import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.admin.stats().then(setStats).catch(console.error);
  }, []);

  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <h1 className="page-title">Dashboard</h1>
      </header>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 mb-10">
        {[
          { label: 'Draft posts', value: stats?.drafts ?? '—' },
          { label: 'Published', value: stats?.published ?? '—' },
          {
            label: 'Blog views (7d)',
            value: stats?.views_7d != null ? stats.views_7d.toLocaleString() : '—',
          },
          {
            label: 'Blog views (all)',
            value: stats?.views_all != null ? stats.views_all.toLocaleString() : '—',
          },
          {
            label: 'Orders',
            value:
              stats?.orders_paid != null
                ? `${stats.orders_paid} paid`
                : (stats?.orders ?? '—'),
          },
          {
            label: 'Contacts',
            value:
              stats?.contacts_unread != null && stats.contacts_unread > 0
                ? `${stats.contacts_unread} new`
                : (stats?.contacts ?? '—'),
          },
          { label: 'Subscribers', value: stats?.subscribers ?? '—' },
        ].map((s) => (
          <div key={s.label} className="stat-card">
            <p className="text-xs uppercase tracking-widest text-ink-subtle font-medium">{s.label}</p>
            <p className="font-display text-3xl md:text-4xl text-wine mt-2 tabular-nums">{s.value}</p>
          </div>
        ))}
      </div>

      {stats?.top_posts?.length > 0 && (
        <section className="mb-10">
          <h2 className="text-xs uppercase tracking-widest text-ink-subtle font-medium mb-4">
            Top posts by views
          </h2>
          <div className="table-shell">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th className="text-right">Views</th>
                </tr>
              </thead>
              <tbody>
                {stats.top_posts.map((post) => (
                  <tr key={post.id}>
                    <td>
                      <Link to={`/admin/posts/${post.id}`} className="table-action font-medium">
                        {post.title}
                      </Link>
                    </td>
                    <td className="text-right tabular-nums">
                      {(post.view_count || 0).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <div className="flex flex-wrap gap-3">
        <Link to="/admin/posts/new" className="btn-primary">
          New post
        </Link>
        <Link to="/admin/products" className="btn-secondary">
          Manage products
        </Link>
        <Link to="/admin/orders" className="btn-secondary">
          View orders
        </Link>
        <Link to="/admin/contacts" className="btn-secondary">
          View contacts
        </Link>
        <Link to="/admin/subscribers" className="btn-ghost">
          View subscribers
        </Link>
      </div>
    </div>
  );
}
