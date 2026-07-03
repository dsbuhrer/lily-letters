import { requireSupabase } from './client';

async function invokeFunction(name, body) {
  const supabase = requireSupabase();
  const { data, error } = await supabase.functions.invoke(name, { body });
  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);
  return data;
}

export async function createOrder(payload) {
  return invokeFunction('create-order', payload);
}

export async function completeOrderPayment(payload) {
  return invokeFunction('complete-order-payment', payload);
}

export async function getOrderConfirmation(payload) {
  return invokeFunction('get-order-confirmation', payload);
}
