const STATUS_STYLES = {
  pending: 'bg-gold/10 text-gold border-gold/30',
  paid: 'bg-sage/10 text-sage border-sage/35',
  failed: 'bg-red-50 text-red-800 border-red-200/80',
  refunded: 'bg-ink/[0.04] text-ink-muted border-taupe/80',
};

const STATUS_LABELS = {
  pending: 'Processing',
  paid: 'Paid',
  failed: 'Failed',
  refunded: 'Refunded',
};

export default function OrderStatusBadge({ status }) {
  return (
    <span
      className={`badge shrink-0 ${STATUS_STYLES[status] || STATUS_STYLES.pending}`}
    >
      {STATUS_LABELS[status] || status}
    </span>
  );
}
