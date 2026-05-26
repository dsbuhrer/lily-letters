import { Download, ExternalLink } from 'lucide-react';
import { downloadOrderLinksPdf, openCanvaLink } from '../../lib/orderDownloads';
import { isDownloadAvailable } from '../../lib/accountApi';

export default function DownloadButton({ order, variant = 'primary' }) {
  const available = isDownloadAvailable(order);
  const items = order.order_items || [];
  const hasLinks = items.some((i) => i.canva_link);

  if (!available) {
    return (
      <p className="font-body text-sm text-[#2d2020]/50">
        {order.status === 'pending'
          ? 'Downloads will be available once payment is confirmed.'
          : 'Download access has expired or is unavailable.'}
      </p>
    );
  }

  const btnClass = variant === 'primary' ? 'btn-primary' : 'btn-secondary';

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <button
        type="button"
        onClick={() => downloadOrderLinksPdf(order)}
        className={`${btnClass} w-full sm:w-auto`}
        disabled={!hasLinks && items.length === 0}
      >
        <Download size={16} strokeWidth={1.5} />
        Download All Links
      </button>
      {items.length === 1 && items[0].canva_link && (
        <button
          type="button"
          onClick={() => openCanvaLink(items[0].canva_link)}
          className="btn-secondary w-full sm:w-auto"
        >
          <ExternalLink size={16} strokeWidth={1.5} />
          Open in Canva
        </button>
      )}
    </div>
  );
}
