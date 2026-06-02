import {
  PRINTS_OF_LOVE_COUPON,
  PRINTS_OF_LOVE_REFERRAL_PATH,
  PRINTS_OF_LOVE_REFERRAL_URL,
  hasPrintsOfLovePromo,
  mentionsPrintsOfLove,
} from '../constants/printsOfLove.js';

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function printsPromoHtml() {
  return `
    <p>Looking to print? I recommend <a href="${PRINTS_OF_LOVE_REFERRAL_URL}" rel="noopener noreferrer sponsored" target="_blank">Prints of Love</a> for all your professional printing needs. Click my special link below to get started:</p>
    <p><a href="${PRINTS_OF_LOVE_REFERRAL_URL}" rel="noopener noreferrer sponsored" target="_blank">${PRINTS_OF_LOVE_REFERRAL_PATH}</a></p>
    <p>Use code <strong>${PRINTS_OF_LOVE_COUPON}</strong> at Prints of Love for 10% off your order of $49 or more!</p>`;
}

function paragraphToHtml(part) {
  const trimmed = part.trim();
  if (!trimmed) return '';

  if (
    trimmed === PRINTS_OF_LOVE_REFERRAL_URL ||
    trimmed === PRINTS_OF_LOVE_REFERRAL_PATH ||
    trimmed.includes('printsoflove.com/ref/LILYLETTERS')
  ) {
    return `<p><a href="${PRINTS_OF_LOVE_REFERRAL_URL}" rel="noopener noreferrer sponsored" target="_blank">${PRINTS_OF_LOVE_REFERRAL_PATH}</a></p>`;
  }

  if (trimmed.includes(PRINTS_OF_LOVE_COUPON)) {
    const safe = escapeHtml(trimmed).replace(
      PRINTS_OF_LOVE_COUPON,
      `<strong>${PRINTS_OF_LOVE_COUPON}</strong>`,
    );
    return `<p>${safe}</p>`;
  }

  if (mentionsPrintsOfLove(trimmed) && !hasPrintsOfLovePromo(trimmed)) {
    const linked = escapeHtml(trimmed).replace(
      /Prints of Love/gi,
      `<a href="${PRINTS_OF_LOVE_REFERRAL_URL}" rel="noopener noreferrer sponsored" target="_blank">$&</a>`,
    );
    return `<p>${linked}</p>`;
  }

  return `<p>${escapeHtml(trimmed)}</p>`;
}

/** HTML for static blog prerender FAQ answers */
export function formatFaqAnswerHtml(answer = '') {
  if (!answer.trim()) return '';

  const paragraphs = answer.split(/\n\n+/).filter((p) => p.trim());
  let html = paragraphs.map(paragraphToHtml).join('');

  if (mentionsPrintsOfLove(answer) && !hasPrintsOfLovePromo(answer)) {
    html += printsPromoHtml();
  }

  return html;
}
