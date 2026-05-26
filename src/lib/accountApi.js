export async function fetchOrders(supabase, userId) {
  const { data, error } = await supabase
    .from('orders')
    .select(
      `
      id,
      order_number,
      email,
      status,
      subtotal_cents,
      currency,
      paid_at,
      download_expires_at,
      created_at,
      order_items (
        id,
        product_id,
        product_name,
        product_slug,
        price_cents,
        canva_link
      )
    `,
    )
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function fetchOrderByNumber(supabase, userId, orderNumber) {
  const { data, error } = await supabase
    .from('orders')
    .select(
      `
      id,
      order_number,
      email,
      status,
      subtotal_cents,
      currency,
      paid_at,
      download_expires_at,
      billing_name,
      billing_address,
      created_at,
      order_items (
        id,
        product_id,
        product_name,
        product_slug,
        price_cents,
        canva_link
      )
    `,
    )
    .eq('user_id', userId)
    .eq('order_number', orderNumber)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export function formatCents(cents, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(cents / 100);
}

export function formatOrderDate(iso) {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(iso));
}

export function isDownloadAvailable(order) {
  if (order.status !== 'paid') return false;
  if (!order.download_expires_at) return true;
  return new Date(order.download_expires_at) > new Date();
}

export function orderStatusLabel(status) {
  const labels = {
    pending: 'Processing payment',
    paid: 'Paid',
    failed: 'Payment failed',
    refunded: 'Refunded',
  };
  return labels[status] || status;
}
