import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { sendSmtpMail } from './smtp.ts';

const EMAIL_PDF_URL_TTL = 7 * 24 * 3600;

export type OrderEmailDetails = {
  order_number: string;
  email: string;
  billing_name: string | null;
};

type OrderEmailItem = {
  product_name: string;
  canva_link: string | null;
  pdf_url: string | null;
  pdf_file_name: string | null;
};

type OrderEmailItemWithLinks = OrderEmailItem & {
  pdf_download_url: string | null;
};

type PdfAttachment = {
  filename: string;
  content: Uint8Array;
};

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function sanitizePdfFileName(name: string) {
  const trimmed = name.trim();
  if (!trimmed) return 'download.pdf';
  const withExt = /\.pdf$/i.test(trimmed) ? trimmed : `${trimmed}.pdf`;
  return withExt.replace(/[/\\?%*:|"<>]/g, '-');
}

function resolveAttachmentFilename(item: OrderEmailItem, orderNumber: string) {
  if (item.pdf_file_name) return sanitizePdfFileName(item.pdf_file_name);
  const safeName = (item.product_name || 'template').replace(/[^\w\s-]/g, '').trim() || 'template';
  return `${orderNumber}-${safeName}.pdf`;
}

async function downloadPdfBytes(
  supabase: SupabaseClient,
  path: string | null,
): Promise<Uint8Array | null> {
  if (!path) return null;

  if (path.startsWith('http')) {
    const response = await fetch(path);
    if (!response.ok) return null;
    return new Uint8Array(await response.arrayBuffer());
  }

  const { data, error } = await supabase.storage.from('product-downloads').download(path);
  if (error || !data) return null;
  return new Uint8Array(await data.arrayBuffer());
}

async function buildPdfAttachments(
  supabase: SupabaseClient,
  orderNumber: string,
  items: OrderEmailItem[],
): Promise<PdfAttachment[]> {
  const attachments: PdfAttachment[] = [];

  for (const item of items) {
    if (!item.pdf_url) continue;
    const content = await downloadPdfBytes(supabase, item.pdf_url);
    if (!content) continue;
    attachments.push({
      filename: resolveAttachmentFilename(item, orderNumber),
      content,
    });
  }

  return attachments;
}

async function signedPdfUrlForEmail(
  supabase: SupabaseClient,
  path: string | null,
): Promise<string | null> {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  const { data, error } = await supabase.storage
    .from('product-downloads')
    .createSignedUrl(path, EMAIL_PDF_URL_TTL);
  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}

async function resolveItemsWithPdfLinks(
  supabase: SupabaseClient,
  items: OrderEmailItem[],
): Promise<OrderEmailItemWithLinks[]> {
  return Promise.all(
    items.map(async (item) => ({
      ...item,
      pdf_download_url: await signedPdfUrlForEmail(supabase, item.pdf_url),
    })),
  );
}

function templateLinkForItem(item: OrderEmailItemWithLinks) {
  return item.pdf_download_url || item.canva_link;
}

function buildOrderEmailHtml(
  order: OrderEmailDetails,
  items: OrderEmailItemWithLinks[],
  siteUrl: string,
) {
  const firstName = (order.billing_name || 'there').split(' ')[0] || 'there';
  const productLines = items
    .map((item) => {
      const hasPdf = Boolean(item.pdf_url);
      const templateLink = templateLinkForItem(item);
      const canva = templateLink
        ? `<br><a href="${escapeHtml(templateLink)}" style="color: #5c1a33;">Open Canva template</a>`
        : '';
      const delivery = hasPdf ? 'PDF attached to this email' : item.canva_link ? 'Canva template link below' : '';
      return `<li style="margin-bottom: 10px;"><strong>${escapeHtml(item.product_name)}</strong>${
        delivery ? `<br><span style="color: #6b5b55; font-size: 14px;">${delivery}</span>` : ''
      }${canva}</li>`;
    })
    .join('');

  const confirmationUrl = `${siteUrl.replace(/\/$/, '')}/order-confirmation?order=${encodeURIComponent(order.order_number)}`;

  return `
    <div style="font-family: Georgia, serif; color: #2c1810; line-height: 1.6; max-width: 560px;">
      <p style="margin: 0 0 16px; font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; color: #8b6914;">
        Order confirmed
      </p>
      <h1 style="margin: 0 0 12px; font-size: 28px; font-weight: 400; color: #5c1a33;">
        Thank you, ${escapeHtml(firstName)}!
      </h1>
      <p style="margin: 0 0 20px; color: #6b5b55;">
        Your order <strong style="color: #5c1a33;">${escapeHtml(order.order_number)}</strong> is confirmed.
        Your template${items.length === 1 ? '' : 's'} ${items.some((i) => i.pdf_url) ? 'are attached to this email' : 'details are below'}.
      </p>
      <div style="border-top: 1px solid #e8dfd4; border-bottom: 1px solid #e8dfd4; padding: 16px 0; margin-bottom: 20px;">
        <p style="margin: 0 0 12px; font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; color: #8b6914;">
          Your purchase
        </p>
        <ul style="margin: 0; padding-left: 20px;">${productLines}</ul>
      </div>
      <p style="margin: 0 0 16px; color: #6b5b55; font-size: 14px;">
        You can also download your files anytime from your
        <a href="${escapeHtml(confirmationUrl)}" style="color: #5c1a33;">order confirmation page</a>.
      </p>
      <p style="margin: 0; color: #6b5b55; font-size: 13px;">
        Need help? Reply to this email or contact us at thelilyletters.co@gmail.com
      </p>
      <p style="margin: 24px 0 0; font-size: 12px; color: #a89890;">
        The Lily Letters Co.
      </p>
    </div>
  `.trim();
}

function buildOrderEmailText(
  order: OrderEmailDetails,
  items: OrderEmailItemWithLinks[],
  siteUrl: string,
) {
  const firstName = (order.billing_name || 'there').split(' ')[0] || 'there';
  const confirmationUrl = `${siteUrl.replace(/\/$/, '')}/order-confirmation?order=${encodeURIComponent(order.order_number)}`;
  const lines = [
    `Thank you, ${firstName}!`,
    '',
    `Your order ${order.order_number} is confirmed.`,
    '',
    'Your purchase:',
  ];

  for (const item of items) {
    lines.push(`- ${item.product_name}`);
    if (item.pdf_url) lines.push('  PDF attached to this email');
    const templateLink = templateLinkForItem(item);
    if (templateLink) lines.push(`  Open Canva template: ${templateLink}`);
  }

  lines.push('', `Order confirmation: ${confirmationUrl}`, '', 'The Lily Letters Co.');
  return lines.join('\n');
}

export async function sendOrderConfirmationEmail(
  supabase: SupabaseClient,
  order: OrderEmailDetails,
  items: OrderEmailItem[],
) {
  if (!items.length) {
    console.warn(`Order ${order.order_number} has no items; confirmation email skipped.`);
    return { sent: false, reason: 'no_items' as const };
  }

  const siteUrl = Deno.env.get('SITE_URL') || 'https://thelilylettersco.com';
  const itemsWithLinks = await resolveItemsWithPdfLinks(supabase, items);
  const attachments = await buildPdfAttachments(supabase, order.order_number, items);
  const productNames = items.map((item) => item.product_name).join(', ');
  const subject = `Order Confirmed: ${productNames} (${order.order_number})`;

  return sendSmtpMail({
    to: order.email,
    subject,
    content: buildOrderEmailText(order, itemsWithLinks, siteUrl),
    html: buildOrderEmailHtml(order, itemsWithLinks, siteUrl),
    attachments: attachments.map((attachment) => ({
      filename: attachment.filename,
      content: attachment.content,
      encoding: 'binary',
    })),
  });
}
