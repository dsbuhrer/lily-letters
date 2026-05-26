import { getSupabaseClient, isSupabaseConfigured } from '../supabaseClient';

export function requireSupabase() {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error(
      'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env',
    );
  }
  return client;
}

export { isSupabaseConfigured };
