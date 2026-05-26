import { Link } from 'react-router-dom';
import { ChevronRight, Package } from 'lucide-react';
import OrderStatusBadge from './OrderStatusBadge';
import { formatCents, formatOrderDate, isDownloadAvailable } from '../../lib/accountApi';

export default function OrderCard({ order }) {
  const itemCount = order.order_items?.length ?? 0;
  const downloadable = isDownloadAvailable(order);

  return (
    <Link
      to={`/account/orders/${order.order_number}`}
      className="block bg-white border border-taupe/30 p-5 hover:border-wine/30 transition-colors group"
    >
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 bg-wine/10 flex items-center justify-center shrink-0">
            <Package size={18} className="text-wine" strokeWidth={1.5} />
          </div>
          <div className="min-w-0">
            <p className="font-body text-sm font-medium text-wine truncate">
              {order.order_number}
            </p>
            <p className="font-body text-xs text-[#2d2020]/50">
              {formatOrderDate(order.paid_at || order.created_at)}
            </p>
          </div>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="font-body text-sm text-[#2d2020]/70 truncate">
            {itemCount} template{itemCount !== 1 ? 's' : ''}
            {downloadable && (
              <span className="text-sage ml-2">· Ready to download</span>
            )}
          </p>
          <p className="font-display text-lg text-wine mt-1">
            {formatCents(order.subtotal_cents, order.currency)}
          </p>
        </div>
        <ChevronRight
          size={18}
          className="text-[#2d2020]/30 group-hover:text-wine transition-colors shrink-0"
        />
      </div>
    </Link>
  );
}
