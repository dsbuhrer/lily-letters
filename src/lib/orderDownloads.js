/**
 * Client-side download helpers for order templates and PDFs.
 */

import { getSignedDownloadUrl, isStoragePath } from './downloadUrl';

function sanitizePdfFileName(name) {
  const trimmed = (name || '').trim();
  if (!trimmed) return 'download.pdf';
  const withExt = /\.pdf$/i.test(trimmed) ? trimmed : `${trimmed}.pdf`;
  return withExt.replace(/[/\\?%*:|"<>]/g, '-');
}

function resolveDownloadFilename(item, orderNumber) {
  if (item.pdf_file_name) return sanitizePdfFileName(item.pdf_file_name);
  const safeName = (item.product_name || 'template').replace(/[^\w\s-]/g, '').trim() || 'template';
  return `${orderNumber}-${safeName}.pdf`;
}

async function triggerBlobDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

async function resolvePdfUrl(item) {
  if (item.pdf_signed_url) return item.pdf_signed_url;
  if (item.pdf_url && item.pdf_url.startsWith('http')) return item.pdf_url;
  if (item.pdf_url && isStoragePath(item.pdf_url)) {
    return getSignedDownloadUrl(item.pdf_url);
  }
  return null;
}

export async function downloadItemPdf(item, orderNumber) {
  const url = await resolvePdfUrl(item);
  if (!url) throw new Error('PDF download is not available for this item.');

  const response = await fetch(url);
  if (!response.ok) throw new Error('Could not download PDF.');

  const blob = await response.blob();
  const filename = resolveDownloadFilename(item, orderNumber);
  triggerBlobDownload(blob, filename);
}

export async function downloadOrderPdfs(order) {
  const items = (order.order_items || []).filter((i) => i.pdf_url || i.pdf_signed_url);
  if (!items.length) {
    const legacy = (order.order_items || []).filter((i) => i.canva_link);
    if (legacy.length) {
      downloadOrderLinksPdf(order);
      return;
    }
    throw new Error('No PDF downloads available for this order.');
  }

  for (const item of items) {
    await downloadItemPdf(item, order.order_number);
  }
}

/** @deprecated Legacy Canva link download as .txt */
export function downloadOrderLinksPdf(order) {
  const items = order.order_items || [];
  const lines = [
    'The Lily Letters Co. — Your Template Links',
    `Order: ${order.order_number}`,
    `Date: ${new Date(order.paid_at || order.created_at).toLocaleDateString()}`,
    '',
    'Your Canva Template Links:',
    '─────────────────────────',
    '',
  ];

  items.forEach((item, i) => {
    lines.push(`${i + 1}. ${item.product_name}`);
    if (item.canva_link) {
      lines.push(`   ${item.canva_link}`);
    } else {
      lines.push('   (Link not available — contact support)');
    }
    lines.push('');
  });

  lines.push('How to use:');
  lines.push('1. Open each link in your browser');
  lines.push('2. Sign in to Canva (free account works)');
  lines.push('3. Click "Use template" to customize');
  lines.push('');
  lines.push('Need help? thelilyletters.co@gmail.com');

  const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
  triggerBlobDownload(blob, `${order.order_number}-canva-links.txt`);
}

export function openCanvaLink(link) {
  if (link) {
    window.open(link, '_blank', 'noopener,noreferrer');
  }
}

export function orderHasPdfDownload(order) {
  return (order.order_items || []).some((i) => i.pdf_url || i.pdf_signed_url);
}

export function orderHasLegacyCanvaDownload(order) {
  return (order.order_items || []).some((i) => i.canva_link);
}
