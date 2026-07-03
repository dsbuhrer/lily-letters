import { useState } from 'react';
import { Download } from 'lucide-react';
import {
  downloadOrderPdfs,
  downloadOrderLinksPdf,
  orderHasPdfDownload,
  orderHasLegacyCanvaDownload,
} from '../../lib/orderDownloads';
import { isDownloadAvailable } from '../../lib/accountApi';

export default function DownloadButton({ order, variant = 'primary' }) {
  const [downloading, setDownloading] = useState(false);
  const available = isDownloadAvailable(order);
  const items = order.order_items || [];
  const hasPdf = orderHasPdfDownload(order);
  const hasLegacy = orderHasLegacyCanvaDownload(order);

  if (!available) {
    const messages = {
      pending: 'Downloads will be available once payment is confirmed.',
      failed: 'Payment failed — downloads are not available for this order.',
      refunded: 'This order was refunded — downloads are no longer available.',
    };
    return (
      <p className="font-body text-sm text-ink-subtle">
        {messages[order.status] || 'Download access is unavailable.'}
      </p>
    );
  }

  const btnClass = variant === 'primary' ? 'btn-primary' : 'btn-secondary';

  const handleDownload = async () => {
    setDownloading(true);
    try {
      if (hasPdf) {
        await downloadOrderPdfs(order);
      } else if (hasLegacy) {
        downloadOrderLinksPdf(order);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDownloading(false);
    }
  };

  if (!hasPdf && !hasLegacy && items.length === 0) {
    return (
      <p className="font-body text-sm text-ink-subtle">No downloads available for this order.</p>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <button
        type="button"
        onClick={handleDownload}
        className={`${btnClass} w-full sm:w-auto`}
        disabled={downloading || (!hasPdf && !hasLegacy)}
      >
        <Download size={16} strokeWidth={1.5} />
        {downloading ? 'Downloading…' : hasPdf ? 'Download PDF' : 'Download All Links'}
      </button>
    </div>
  );
}
