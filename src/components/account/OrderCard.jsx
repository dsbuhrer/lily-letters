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
      className="block card-surface-interactive p-5 md:p-6 group focus-visible:outline-offset-2"
    >
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 bg-wine/8 flex items-center justify-center shrink-0 ring-1 ring-wine/10">
            <Package size={18} className="text-wine" strokeWidth={1.5} />
          </div>
          <div className="min-w-0">
            <p className="font-body text-sm font-medium text-wine truncate">
              {order.order_number}
            </p>
            <p className="font-body text-xs text-ink-subtle mt-0.5">
              {formatOrderDate(order.paid_at || order.created_at)}
            </p>
          </div>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="font-body text-sm text-ink-muted truncate">
            {itemCount} template{itemCount !== 1 ? 's' : ''}
            {downloadable && (
              <span className="text-sage font-medium ml-2">· Ready to download</span>
            )}
          </p>
          <p className="font-display text-lg md:text-xl font-light text-wine mt-1">
            {formatCents(order.subtotal_cents, order.currency)}
          </p>
        </div>
        <ChevronRight
          size={18}
          className="text-ink-faint group-hover:text-wine group-hover:translate-x-0.5 transition-all shrink-0"
        />
      </div>
    </Link>
  );
}
