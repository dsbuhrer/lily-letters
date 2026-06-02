import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Download } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { fetchOrders, formatOrderDate, isDownloadAvailable } from '../../lib/accountApi';
import OrderCard from '../../components/account/OrderCard';
import DownloadButton from '../../components/account/DownloadButton';

export default function AccountDashboardPage() {
  const { user, supabase } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase || !user) return;
    fetchOrders(supabase, user.id)
      .then(setOrders)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [supabase, user]);

  const latestOrder = orders[0];
  const downloadableOrder = orders.find(isDownloadAvailable);

  if (loading) {
    return <p className="font-body text-sm text-ink-subtle">Loading your account…</p>;
  }

  if (orders.length === 0) {
    return (
      <div className="panel panel-padding text-center">
        <p className="font-display text-2xl text-wine mb-3">No purchases yet</p>
        <p className="font-body text-sm text-ink-muted mb-6 max-w-sm mx-auto">
          When you buy a template, your orders and Canva download links will appear here.
        </p>
        <Link to="/products" className="btn-primary inline-flex">
          Browse templates
        </Link>
        <p className="mt-6">
          <Link to="/faq" className="font-body text-sm text-gold hover:text-wine transition-colors">
            Questions about downloads?
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {downloadableOrder && (
        <section className="panel panel-padding">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-sage/15 flex items-center justify-center">
              <Download size={20} className="text-sage" strokeWidth={1.5} />
            </div>
            <div>
              <h2 className="font-display text-xl text-wine">Quick download</h2>
              <p className="font-body text-xs text-ink-subtle">
                Order {downloadableOrder.order_number} ·{' '}
                {formatOrderDate(downloadableOrder.paid_at || downloadableOrder.created_at)}
              </p>
            </div>
          </div>
          <DownloadButton order={downloadableOrder} />
        </section>
      )}

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl text-wine">Recent orders</h2>
          {orders.length > 1 && (
            <Link
              to="/account/orders"
              className="font-body text-sm text-gold hover:text-wine flex items-center gap-1"
            >
              View all
              <ArrowRight size={14} />
            </Link>
          )}
        </div>
        <div className="space-y-3">
          {orders.slice(0, 3).map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      </section>

      {latestOrder?.status === 'pending' && (
        <p className="font-body text-sm text-ink-muted bg-gold/10 border border-gold/20 p-4">
          Your latest order is still processing. Downloads will unlock once payment is confirmed.
        </p>
      )}
    </div>
  );
}
