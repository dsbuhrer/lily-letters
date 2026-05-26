import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  fetchOrderByNumber,
  formatCents,
  formatOrderDate,
  isDownloadAvailable,
} from '../../lib/accountApi';
import OrderStatusBadge from '../../components/account/OrderStatusBadge';
import DownloadButton from '../../components/account/DownloadButton';
import { openCanvaLink } from '../../lib/orderDownloads';

export default function AccountOrderDetailPage() {
  const { orderNumber } = useParams();
  const { user, supabase } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!supabase || !user || !orderNumber) return;
    fetchOrderByNumber(supabase, user.id, orderNumber)
      .then((data) => {
        if (!data) setNotFound(true);
        else setOrder(data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [supabase, user, orderNumber]);

  if (loading) {
    return <p className="font-body text-sm text-[#2d2020]/50">Loading order…</p>;
  }

  if (notFound || !order) {
    return (
      <div className="text-center py-12">
        <p className="font-display text-2xl text-wine mb-4">Order not found</p>
        <Link to="/account/orders" className="btn-primary inline-flex">
          Back to orders
        </Link>
      </div>
    );
  }

  const downloadable = isDownloadAvailable(order);
  const items = order.order_items || [];

  return (
    <div>
      <Link
        to="/account/orders"
        className="inline-flex items-center gap-2 font-body text-sm text-[#2d2020]/50 hover:text-wine mb-6"
      >
        <ArrowLeft size={16} />
        All orders
      </Link>

      <div className="bg-white border border-taupe/30 p-6 mb-6">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div>
            <h2 className="font-display text-2xl text-wine">{order.order_number}</h2>
            <p className="font-body text-sm text-[#2d2020]/50 mt-1">
              Placed {formatOrderDate(order.created_at)}
            </p>
          </div>
          <OrderStatusBadge status={order.status} />
        </div>

        <div className="grid sm:grid-cols-2 gap-4 mb-6 text-sm font-body">
          <div>
            <p className="text-[#2d2020]/40 uppercase tracking-widest text-xs mb-1">Total</p>
            <p className="font-display text-xl text-wine">
              {formatCents(order.subtotal_cents, order.currency)}
            </p>
          </div>
          {order.download_expires_at && (
            <div>
              <p className="text-[#2d2020]/40 uppercase tracking-widest text-xs mb-1">
                Download access until
              </p>
              <p className="text-[#2d2020]/70">{formatOrderDate(order.download_expires_at)}</p>
            </div>
          )}
        </div>

        <DownloadButton order={order} />

        <Link
          to={`/contact?topic=Order+%26+Download+Issues&order=${encodeURIComponent(order.order_number)}`}
          className="inline-block mt-4 font-body text-sm text-gold hover:text-wine transition-colors"
        >
          Problem with this order?
        </Link>
      </div>

      <h3 className="font-display text-lg text-wine mb-4">Templates in this order</h3>
      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="bg-white border border-taupe/30 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          >
            <div className="flex items-start gap-3 min-w-0">
              <Check size={14} className="text-sage mt-1 shrink-0" />
              <div className="min-w-0">
                <p className="font-body text-sm font-medium text-[#2d2020]">{item.product_name}</p>
                <p className="font-body text-xs text-gold">Canva template</p>
              </div>
            </div>
            {downloadable && item.canva_link ? (
              <button
                type="button"
                onClick={() => openCanvaLink(item.canva_link)}
                className="btn-secondary text-xs py-2 px-4 shrink-0"
              >
                <ExternalLink size={14} />
                Open in Canva
              </button>
            ) : (
              <span className="font-body text-xs text-[#2d2020]/40">Unavailable</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
