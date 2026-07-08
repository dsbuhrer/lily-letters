// USD → BRL conversion using a free live FX API (no API key required).
// Stripe's FX Quotes API is unavailable for Brazil-based accounts, so we source
// the rate externally and charge in BRL (account settles in BRL, no Stripe FX).

const DEFAULT_FX_API_URL = 'https://open.er-api.com/v6/latest/USD';
export const RATE_DRIFT_TOLERANCE = 0.02; // 2% between preview and confirm

export type BrlConversion = {
  brlCents: number;
  usdCents: number;
  exchangeRate: number;
  baseRate: number;
  marginPercent: number;
};

function getMarginPercent(): number {
  const raw = Deno.env.get('USD_BRL_MARGIN_PERCENT');
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

/** Fetch the current USD→BRL base rate and apply the configured safety margin. */
export async function getUsdToBrlRate(): Promise<{
  rate: number;
  baseRate: number;
  marginPercent: number;
}> {
  const url = Deno.env.get('FX_RATE_API_URL') || DEFAULT_FX_API_URL;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error('Failed to fetch USD→BRL exchange rate.');
  }

  const data = await res.json();
  const baseRate = Number(data?.rates?.BRL);
  if (!Number.isFinite(baseRate) || baseRate <= 0) {
    throw new Error('Exchange rate provider did not return a valid BRL rate.');
  }

  const marginPercent = getMarginPercent();
  const rate = baseRate * (1 + marginPercent / 100);

  return { rate, baseRate, marginPercent };
}

export function usdCentsToBrlCents(usdCents: number, rate: number): number {
  if (!rate || rate <= 0) {
    throw new Error('Invalid exchange rate.');
  }
  const brlCents = Math.round(usdCents * rate);
  if (brlCents < 50) {
    throw new Error('Converted BRL amount is below Stripe minimum (R$0.50).');
  }
  return brlCents;
}

export async function convertUsdToBrl(usdCents: number): Promise<BrlConversion> {
  if (!usdCents || usdCents <= 0) {
    throw new Error('USD amount must be greater than zero.');
  }

  const { rate, baseRate, marginPercent } = await getUsdToBrlRate();

  return {
    brlCents: usdCentsToBrlCents(usdCents, rate),
    usdCents,
    exchangeRate: rate,
    baseRate,
    marginPercent,
  };
}

/**
 * Recompute the current BRL amount and confirm it hasn't drifted beyond the
 * tolerance from the amount the customer accepted in the preview modal.
 * Throws 'rate_changed' if the drift is too large so the UI can re-quote.
 */
export async function validateQuotedBrlCents(
  usdCents: number,
  quotedBrlCents: number,
): Promise<BrlConversion> {
  const current = await convertUsdToBrl(usdCents);
  const drift = Math.abs(current.brlCents - quotedBrlCents) / quotedBrlCents;
  if (drift > RATE_DRIFT_TOLERANCE) {
    throw new Error('rate_changed');
  }
  return { ...current, brlCents: quotedBrlCents };
}
