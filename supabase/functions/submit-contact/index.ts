import { corsHeaders, jsonResponse } from '../_shared/cors.ts';
import { sendContactNotification } from '../_shared/contactNotify.ts';
import { getServiceSupabase } from '../_shared/orders.ts';

const CONTACT_TOPICS = [
  'Order & Download Issues',
  'Template Customization Help',
  'Canva Access Questions',
  'Refunds & Returns',
  'Collaboration / Wholesale',
  'Other',
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validationError(message: string, fields: Record<string, string>) {
  return jsonResponse({ error: message, fields }, 400);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  try {
    const body = await req.json();
    const name = String(body.name || '').trim();
    const email = String(body.email || '').trim();
    const message = String(body.message || '').trim();
    const rawTopic = String(body.topic || '').trim();
    const fields: Record<string, string> = {};

    if (!name) {
      fields.name = 'Please enter your name.';
    } else if (name.length > 200) {
      fields.name = 'Name must be 200 characters or fewer.';
    }

    if (!email) {
      fields.email = 'Please enter your email address.';
    } else if (!EMAIL_RE.test(email)) {
      fields.email = 'Please enter a valid email address (e.g. yourname@example.com).';
    } else if (email.length > 320) {
      fields.email = 'Email address is too long.';
    }

    if (rawTopic.length > 120) {
      fields.topic = 'Topic must be 120 characters or fewer.';
    }

    if (!message) {
      fields.message = 'Please enter your message.';
    } else if (message.length > 5000) {
      fields.message = 'Message must be 5,000 characters or fewer.';
    }

    if (Object.keys(fields).length > 0) {
      const summary =
        Object.keys(fields).length === 1
          ? Object.values(fields)[0]
          : 'Please correct the highlighted fields below.';
      return validationError(summary, fields);
    }

    const topic =
      rawTopic && CONTACT_TOPICS.includes(rawTopic) ? rawTopic : rawTopic || null;

    const supabase = getServiceSupabase();
    const { data: contact, error } = await supabase
      .from('contacts')
      .insert({
        name,
        email: email.toLowerCase(),
        topic,
        message,
        source: 'contact',
        ip_hash: null,
      })
      .select('id, name, email, topic, message, created_at')
      .single();

    if (error) throw error;

    let emailSent = false;
    try {
      const result = await sendContactNotification({
        name: contact.name,
        email: contact.email,
        topic: contact.topic,
        message: contact.message,
        createdAt: contact.created_at,
      });
      emailSent = result.sent;
    } catch (emailError) {
      console.error('submit-contact email', emailError);
    }

    return jsonResponse({ ok: true, emailSent });
  } catch (err) {
    console.error('submit-contact', err);
    return jsonResponse(
      { error: err instanceof Error ? err.message : 'Could not send your message.' },
      500,
    );
  }
});
