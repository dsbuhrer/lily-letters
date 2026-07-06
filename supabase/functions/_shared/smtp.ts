import { SMTPClient } from 'https://deno.land/x/denomailer@1.6.0/mod.ts';

export type SmtpConfig = {
  host: string;
  port: number;
  user: string;
  password: string | undefined;
  fromEmail: string;
};

export function getSmtpConfig(): SmtpConfig {
  const host = Deno.env.get('SMTP_HOST') || 'smtp.hostinger.com';
  const port = Number(Deno.env.get('SMTP_PORT') || '465');
  const user = Deno.env.get('SMTP_USER') || 'no-reply@thelilylettersco.com';
  const password = Deno.env.get('SMTP_PASSWORD');
  const fromEmail =
    Deno.env.get('ORDER_FROM_EMAIL') || 'The Lily Letters Co. <no-reply@thelilylettersco.com>';

  return { host, port, user, password, fromEmail };
}

export type SmtpMessage = {
  to: string;
  subject: string;
  content: string;
  html?: string;
  replyTo?: string;
  attachments?: Array<{
    filename: string;
    content: Uint8Array;
    encoding: 'binary';
  }>;
};

export async function sendSmtpMail(message: SmtpMessage) {
  const config = getSmtpConfig();
  if (!config.password) {
    console.warn('SMTP_PASSWORD is not configured; email not sent.');
    return { sent: false as const, reason: 'missing_smtp_password' as const };
  }

  const client = new SMTPClient({
    connection: {
      hostname: config.host,
      port: config.port,
      tls: true,
      auth: {
        username: config.user,
        password: config.password,
      },
    },
  });

  try {
    await client.send({
      from: config.fromEmail,
      to: message.to,
      subject: message.subject,
      content: message.content,
      html: message.html,
      replyTo: message.replyTo,
      attachments: message.attachments,
    });
  } finally {
    await client.close();
  }

  return { sent: true as const };
}
