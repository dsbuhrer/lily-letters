import { useEffect, useState } from 'react';
import api from '../../lib/api';

const DEVICE_LABELS = {
  desktop: 'Desktop',
  mobile: 'Mobile',
  tablet: 'Tablet',
  unknown: 'Unknown',
};

function formatCount(n) {
  return typeof n === 'number' ? n.toLocaleString() : '—';
}

export default function PostAnalyticsPanel({ postId }) {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!postId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    api.admin
      .postAnalytics(postId)
      .then((data) => {
        if (!cancelled) setAnalytics(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err?.message || 'Could not load analytics');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [postId]);

  if (!postId) return null;

  return (
    <section className="mb-8 p-5 border border-taupe bg-[#f8f5ef]">
      <h2 className="text-xs uppercase tracking-widest text-ink-subtle font-medium mb-4">
        Analytics
      </h2>
      {loading && <p className="text-sm text-ink-subtle">Loading metrics…</p>}
      {error && <p className="text-sm text-red-800">{error}</p>}
      {!loading && !error && analytics && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Total views', value: analytics.view_count },
              { label: 'Last 7 days', value: analytics.views_7d },
              { label: 'Last 30 days', value: analytics.views_30d },
              { label: 'Logged events', value: analytics.views_logged },
            ].map((item) => (
              <div key={item.label}>
                <p className="text-xs uppercase tracking-widest text-ink-subtle">{item.label}</p>
                <p className="font-display text-2xl text-wine mt-1 tabular-nums">
                  {formatCount(item.value)}
                </p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <p className="text-xs uppercase tracking-widest text-ink-subtle mb-2">Devices</p>
              {analytics.by_device?.length ? (
                <ul className="space-y-1.5 text-sm">
                  {analytics.by_device.map((row) => (
                    <li key={row.device} className="flex justify-between gap-4">
                      <span>{DEVICE_LABELS[row.device] || row.device}</span>
                      <span className="tabular-nums text-ink-muted">{formatCount(row.count)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-ink-subtle">No device data yet.</p>
              )}
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-ink-subtle mb-2">Top countries</p>
              {analytics.by_country?.length ? (
                <ul className="space-y-1.5 text-sm">
                  {analytics.by_country.map((row) => (
                    <li
                      key={row.country_code || row.country_name}
                      className="flex justify-between gap-4"
                    >
                      <span>
                        {row.country_name || row.country_code}
                        {row.country_code && row.country_name ? (
                          <span className="text-ink-subtle ml-1">({row.country_code})</span>
                        ) : null}
                      </span>
                      <span className="tabular-nums text-ink-muted">{formatCount(row.count)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-ink-subtle">No location data yet.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
