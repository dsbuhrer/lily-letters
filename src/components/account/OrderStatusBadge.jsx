const STATUS_STYLES = {
  pending: 'bg-gold/15 text-gold border-gold/30',
  paid: 'bg-sage/15 text-sage border-sage/30',
  failed: 'bg-red-100 text-red-700 border-red-200',
  refunded: 'bg-[#2d2020]/10 text-[#2d2020]/60 border-taupe/40',
};

export default function OrderStatusBadge({ status }) {
  const labels = {
    pending: 'Processing payment',
    paid: 'Paid',
    failed: 'Payment failed',
    refunded: 'Refunded',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 text-xs font-body font-medium border rounded-sm ${STATUS_STYLES[status] || STATUS_STYLES.pending}`}
    >
      {labels[status] || status}
    </span>
  );
}
