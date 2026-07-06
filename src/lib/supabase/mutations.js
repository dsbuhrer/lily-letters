import { requireSupabase } from './client';

export async function subscribe(email, source = 'footer') {
  const supabase = requireSupabase();
  const normalized = email.toLowerCase().trim();
  const { error } = await supabase.from('subscribers').upsert(
    {
      email: normalized,
      source,
      consent_at: new Date().toISOString(),
      ip_hash: null,
      unsubscribed_at: null,
    },
    { onConflict: 'email' },
  );
  if (error) {
    if (error.code === '23505') throw new Error('Email already subscribed');
    throw new Error(error.message);
  }
  return { ok: true, message: 'Subscribed successfully' };
}

export async function submitContact(payload) {
  const supabase = requireSupabase();
  const { data, error } = await supabase.functions.invoke('submit-contact', { body: payload });
  if (error) throw new Error(error.message);
  if (data?.error) {
    const err = new Error(data.error);
    if (data.fields) err.fields = data.fields;
    throw err;
  }
  return data;
}
