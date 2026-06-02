export const PRINTS_OF_LOVE_REFERRAL_URL = 'https://printsoflove.com/ref/LILYLETTERS';
export const PRINTS_OF_LOVE_REFERRAL_PATH = 'printsoflove.com/ref/LILYLETTERS';
export const PRINTS_OF_LOVE_COUPON = 'LILYLETTERS10';

export function mentionsPrintsOfLove(text = '') {
  return /prints of love/i.test(text) || text.includes(PRINTS_OF_LOVE_REFERRAL_PATH);
}

export function hasPrintsOfLovePromo(text = '') {
  return (
    text.includes(PRINTS_OF_LOVE_REFERRAL_URL) ||
    text.includes(PRINTS_OF_LOVE_REFERRAL_PATH) ||
    text.includes(PRINTS_OF_LOVE_COUPON)
  );
}
