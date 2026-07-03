import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Download, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  fetchOrderByNumber,
  formatCents,
  formatOrderDate,
  isDownloadAvailable,
} from '../../lib/accountApi';
import OrderStatusBadge from '../../components/account/OrderStatusBadge';
import DownloadButton from '../../components/account/DownloadButton';
import { downloadItemPdf } from '../../lib/orderDownloads';

export default function AccountOrderDetailPage() {
  const { orderNumber } = useParams();
  const { user, supabase } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);

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

  const handleItemDownload = async (item) => {
    setDownloadingId(item.id);
    try {
      await downloadItemPdf(item, order.order_number);
    } catch (err) {
      console.error(err);
    } finally {
      setDownloadingId(null);
    }
  };

  if (loading) {
    return <p className="font-body text-sm text-ink-subtle">Loading order…</p>;
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
        className="inline-flex items-center gap-2 font-body text-sm text-ink-subtle hover:text-wine mb-6"
      >
        <ArrowLeft size={16} />
        All orders
      </Link>

      <div className="panel panel-padding mb-6">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div>
            <h2 className="font-display text-2xl text-wine">{order.order_number}</h2>
            <p className="font-body text-sm text-ink-subtle mt-1">
              Placed {formatOrderDate(order.created_at)}
            </p>
          </div>
          <OrderStatusBadge status={order.status} />
        </div>

        <div className="grid sm:grid-cols-2 gap-4 mb-6 text-sm font-body">
          <div>
            <p className="text-ink-faint uppercase tracking-widest text-xs mb-1">Total</p>
            <p className="font-display text-xl text-wine">
              {formatCents(order.subtotal_cents, order.currency)}
            </p>
          </div>
        </div>

        <DownloadButton order={order} />

        <Link
          to={`/contact?topic=Order+%26+Download+Issues&order=${encodeURIComponent(order.order_number)}`}
          className="inline-block mt-4 font-body text-sm text-gold hover:text-wine transition-colors"
        >
          Problem with this order?
        </Link>
      </div>

      <h3 className="font-display text-lg text-wine mb-4">Items in this order</h3>
      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="panel p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-soft"
          >
            <div className="flex items-start gap-3 min-w-0">
              <Check size={14} className="text-sage mt-1 shrink-0" />
              <div className="min-w-0">
                <p className="font-body text-sm font-medium text-ink">{item.product_name}</p>
                <p className="font-body text-xs text-gold">
                  {item.pdf_url ? 'PDF download' : item.canva_link ? 'Canva template (legacy)' : 'Digital product'}
                </p>
              </div>
            </div>
            {downloadable && item.pdf_url ? (
              <button
                type="button"
                onClick={() => handleItemDownload(item)}
                disabled={downloadingId === item.id}
                className="btn-secondary text-xs py-2 px-4 shrink-0"
              >
                <Download size={14} />
                {downloadingId === item.id ? 'Downloading…' : 'Download PDF'}
              </button>
            ) : (
              <span className="font-body text-xs text-ink-faint">Unavailable</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
