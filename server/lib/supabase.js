import { createClient } from '@supabase/supabase-js';
import { getConfig, validateSupabaseConfig } from '../config.js';

let client = null;

export function getSupabase() {
  if (client) return client;
  const check = validateSupabaseConfig();
  if (!check.ok) return null;
  const { supabaseUrl, supabaseServiceKey } = getConfig();
  client = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}

export function requireSupabase() {
  const check = validateSupabaseConfig();
  if (!check.ok) {
    const err = new Error(check.message);
    err.status = 503;
    throw err;
  }
  if (!client) {
    const { supabaseUrl, supabaseServiceKey } = getConfig();
    client = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}
