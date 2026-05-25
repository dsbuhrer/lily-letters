import { createClient } from '@supabase/supabase-js';
import { getConfig } from '../config.js';

let client = null;

export function getSupabase() {
  if (client) return client;
  const { supabaseUrl, supabaseServiceKey } = getConfig();
  if (!supabaseUrl || !supabaseServiceKey) {
    return null;
  }
  client = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}

export function requireSupabase() {
  const sb = getSupabase();
  if (!sb) {
    const err = new Error('Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
    err.status = 503;
    throw err;
  }
  return sb;
}
