import { requireSupabase } from './client';

export async function checkIsAdmin() {
  const supabase = requireSupabase();
  const { data, error } = await supabase.rpc('is_admin');
  if (error) throw new Error(error.message);
  return !!data;
}
