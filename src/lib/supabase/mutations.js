import { requireSupabase } from './client';

const CONTACT_TOPICS = [
  'Order & Download Issues',
  'Template Customization Help',
  'Canva Access Questions',
  'Refunds & Returns',
  'Collaboration / Wholesale',
  'Other',
];

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
  const name = payload.name?.trim();
  const email = payload.email?.trim();
  const message = payload.message?.trim();
  if (!name) {
    const err = new Error('Please enter your name.');
    err.fields = { name: 'Please enter your name.' };
    throw err;
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    const err = new Error('Please enter a valid email address.');
    err.fields = { email: 'Please enter a valid email address (e.g. yourname@example.com).' };
    throw err;
  }
  if (!message) {
    const err = new Error('Please enter your message.');
    err.fields = { message: 'Please enter your message.' };
    throw err;
  }

  const topic =
    payload.topic && CONTACT_TOPICS.includes(payload.topic) ? payload.topic : payload.topic || null;

  const supabase = requireSupabase();
  const { error } = await supabase.from('contacts').insert({
    name,
    email: email.toLowerCase(),
    topic,
    message,
    source: 'contact',
    ip_hash: null,
  });
  if (error) throw new Error(error.message);
  return { ok: true };
}
