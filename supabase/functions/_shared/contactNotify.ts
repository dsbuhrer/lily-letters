const RESEND_API = 'https://api.resend.com/emails';

export type ContactNotification = {
  name: string;
  email: string;
  topic: string | null;
  message: string;
  createdAt: string;
};

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function buildContactEmailHtml(contact: ContactNotification) {
  const topic = contact.topic || 'General';
  const safeMessage = escapeHtml(contact.message).replaceAll('\n', '<br>');

  return `
    <div style="font-family: Georgia, serif; color: #2c1810; line-height: 1.6; max-width: 560px;">
      <p style="margin: 0 0 16px; font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; color: #8b6914;">
        New contact form message
      </p>
      <h1 style="margin: 0 0 20px; font-size: 22px; font-weight: 400; color: #5c1a33;">
        ${escapeHtml(contact.name)}
      </h1>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <tr>
          <td style="padding: 8px 0; color: #6b5b55; width: 90px;">Email</td>
          <td style="padding: 8px 0;"><a href="mailto:${escapeHtml(contact.email)}">${escapeHtml(contact.email)}</a></td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b5b55;">Topic</td>
          <td style="padding: 8px 0;">${escapeHtml(topic)}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b5b55;">Received</td>
          <td style="padding: 8px 0;">${escapeHtml(contact.createdAt)}</td>
        </tr>
      </table>
      <div style="border-top: 1px solid #e8dfd4; padding-top: 16px;">
        <p style="margin: 0 0 8px; font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; color: #8b6914;">
          Message
        </p>
        <p style="margin: 0; white-space: pre-wrap;">${safeMessage}</p>
      </div>
    </div>
  `.trim();
}

export async function sendContactNotification(contact: ContactNotification) {
  const apiKey = Deno.env.get('RESEND_API_KEY');
  const notifyEmail = Deno.env.get('CONTACT_NOTIFY_EMAIL') || 'dsbuhrer@gmail.com';
  const fromEmail =
    Deno.env.get('CONTACT_FROM_EMAIL') || 'The Lily Letters <onboarding@resend.dev>';

  if (!apiKey) {
    console.warn('RESEND_API_KEY is not configured; contact saved but email not sent.');
    return { sent: false, reason: 'missing_api_key' as const };
  }

  const topic = contact.topic || 'General';
  const response = await fetch(RESEND_API, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [notifyEmail],
      reply_to: contact.email,
      subject: `New contact: ${topic} — ${contact.name}`,
      html: buildContactEmailHtml(contact),
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Resend failed (${response.status}): ${text}`);
  }

  return { sent: true as const };
}
