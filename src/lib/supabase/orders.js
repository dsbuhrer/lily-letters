import { requireSupabase } from './client';

export async function createOrder(payload) {
  const supabase = requireSupabase();
  const { data, error } = await supabase.functions.invoke('create-order', { body: payload });
  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);
  return data;
}
