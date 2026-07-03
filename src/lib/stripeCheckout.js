const SITE_URL = import.meta.env.VITE_SITE_URL || 'https://thelilylettersco.com';

export function getSiteUrl() {
  return SITE_URL.replace(/\/$/, '');
}

export function getOrderConfirmationUrl(orderNumber) {
  return `${getSiteUrl()}/order-confirmation?order=${encodeURIComponent(orderNumber)}`;
}

export const CHECKOUT_SESSION_KEY = 'lily_checkout_confirmation';

export function saveCheckoutSession({ email, orderNumber, paymentIntentId }) {
  sessionStorage.setItem(
    CHECKOUT_SESSION_KEY,
    JSON.stringify({ email, orderNumber, paymentIntentId }),
  );
}

export function readCheckoutSession() {
  try {
    const raw = sessionStorage.getItem(CHECKOUT_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearCheckoutSession() {
  sessionStorage.removeItem(CHECKOUT_SESSION_KEY);
}

export function buildBillingDetails({ email, firstName, lastName, billing }) {
  return {
    name: [firstName, lastName].filter(Boolean).join(' ').trim() || undefined,
    email,
    address: {
      line1: billing.street?.trim() || undefined,
      city: billing.city?.trim() || undefined,
      state: billing.stateProvince?.trim() || undefined,
      postal_code: billing.postalCode?.trim() || undefined,
      country: billing.country?.trim() || undefined,
    },
  };
}
