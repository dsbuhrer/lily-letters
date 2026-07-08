import { requireSupabase } from './client';

export class OrderConfirmationError extends Error {
  constructor(message, code = 'unknown') {
    super(message);
    this.name = 'OrderConfirmationError';
    this.code = code;
  }
}

function mapOrderConfirmationError(message) {
  const normalized = String(message || '').toLowerCase();

  if (normalized.includes('order not found') || normalized.includes('not found')) {
    return new OrderConfirmationError(
      'Order not found. Please check your order number.',
      'not_found',
    );
  }
  if (normalized.includes('access') || normalized.includes('do not have')) {
    return new OrderConfirmationError(
      'This email does not match this order. Use the email from your purchase.',
      'email_mismatch',
    );
  }
  if (normalized.includes('payment failed')) {
    return new OrderConfirmationError('Payment failed for this order.', 'payment_failed');
  }
  if (normalized.includes('refunded')) {
    return new OrderConfirmationError('This order has been refunded.', 'refunded');
  }
  if (normalized.includes('processing')) {
    return new OrderConfirmationError('Payment is still processing. Please try again shortly.', 'pending');
  }
  if (normalized.includes('not been completed') || normalized.includes('not completed')) {
    return new OrderConfirmationError('Payment has not been completed yet.', 'payment_incomplete');
  }

  return new OrderConfirmationError(message || 'Could not load your order.', 'unknown');
}

async function invokeFunction(name, body) {
  const supabase = requireSupabase();
  const { data, error } = await supabase.functions.invoke(name, { body });
  if (error) {
    throw mapOrderConfirmationError(error.message);
  }
  if (data?.error) {
    throw mapOrderConfirmationError(data.error);
  }
  return data;
}

export async function createOrder(payload) {
  return invokeFunction('create-order', payload);
}

export async function retryOrderBrl(payload) {
  return invokeFunction('retry-order-brl', payload);
}

export async function completeOrderPayment(payload) {
  return invokeFunction('complete-order-payment', payload);
}

export async function getOrderConfirmation(payload) {
  return invokeFunction('get-order-confirmation', payload);
}
