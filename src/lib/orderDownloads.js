/**
 * Client-side download helpers for order templates.
 */

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
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${order.order_number}-canva-links.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function openCanvaLink(link) {
  if (link) {
    window.open(link, '_blank', 'noopener,noreferrer');
  }
}
