import Stripe from 'https://esm.sh/stripe@17.7.0?target=deno';

export type BrlQuoteResult = {
  fxQuoteId: string;
  brlCents: number;
  usdCents: number;
  exchangeRate: number;
  lockExpiresAt: number | null;
};

/** Convert USD minor units to BRL minor units using Stripe FX exchange rate. */
export function calculateBrlCents(usdCents: number, exchangeRate: number): number {
  if (!exchangeRate || exchangeRate <= 0) {
    throw new Error('Invalid exchange rate from FX quote.');
  }
  const brlCents = Math.round(usdCents / exchangeRate);
  if (brlCents < 50) {
    throw new Error('Converted BRL amount is below Stripe minimum (R$0.50).');
  }
  return brlCents;
}

export async function createBrlQuoteFromUsd(
  stripe: Stripe,
  usdCents: number,
): Promise<BrlQuoteResult> {
  if (!usdCents || usdCents <= 0) {
    throw new Error('USD amount must be greater than zero.');
  }

  const fxQuote = await stripe.fxQuotes.create({
    to_currency: 'usd',
    from_currencies: ['brl'],
    lock_duration: 'hour',
    usage: { type: 'payment' },
  });

  const brlRate = fxQuote.rates?.brl;
  if (!brlRate?.exchange_rate) {
    throw new Error('Stripe FX quote did not return a BRL exchange rate.');
  }

  const exchangeRate = brlRate.exchange_rate;
  const brlCents = calculateBrlCents(usdCents, exchangeRate);

  return {
    fxQuoteId: fxQuote.id,
    brlCents,
    usdCents,
    exchangeRate,
    lockExpiresAt: fxQuote.lock_expires_at ?? null,
  };
}

export async function retrieveBrlQuote(
  stripe: Stripe,
  fxQuoteId: string,
  usdCents: number,
): Promise<BrlQuoteResult> {
  const fxQuote = await stripe.fxQuotes.retrieve(fxQuoteId);

  if (fxQuote.lock_status === 'expired') {
    throw new Error('fx_quote_expired');
  }

  const brlRate = fxQuote.rates?.brl;
  if (!brlRate?.exchange_rate) {
    throw new Error('Stripe FX quote did not return a BRL exchange rate.');
  }

  return {
    fxQuoteId: fxQuote.id,
    brlCents: calculateBrlCents(usdCents, brlRate.exchange_rate),
    usdCents,
    exchangeRate: brlRate.exchange_rate,
    lockExpiresAt: fxQuote.lock_expires_at ?? null,
  };
}
