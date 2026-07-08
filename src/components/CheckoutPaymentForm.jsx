import { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, ShieldCheck } from 'lucide-react';
import { PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { completeOrderPayment } from '../lib/supabase/orders';
import {
  buildBillingDetails,
  getOrderConfirmationUrl,
  saveCheckoutSession,
} from '../lib/stripeCheckout';

function formatChargeAmount(amount, currency = 'USD') {
  return new Intl.NumberFormat(currency === 'BRL' ? 'pt-BR' : 'en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

export default function CheckoutPaymentForm({
  orderNumber,
  paymentIntentId,
  email,
  firstName,
  lastName,
  billing,
  chargeAmount,
  currency = 'USD',
  onSuccess,
  onError,
  onBrlRetryRequired,
  userId,
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [paymentError, setPaymentError] = useState('');

  const completeSuccessfulPayment = async (resolvedPaymentIntentId) => {
    const result = await completeOrderPayment({
      orderNumber,
      paymentIntentId: resolvedPaymentIntentId,
      email,
      userId,
    });
    onSuccess(result);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setPaymentError('');

    saveCheckoutSession({ email, orderNumber, paymentIntentId });

    const returnUrl = getOrderConfirmationUrl(orderNumber);
    const billingDetails = buildBillingDetails({ email, firstName, lastName, billing });

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
      confirmParams: {
        return_url: returnUrl,
        receipt_email: email,
        payment_method_data: {
          billing_details: billingDetails,
        },
      },
    });

    if (error) {
      if (error.decline_code === 'currency_not_supported') {
        setPaymentError('');
        setLoading(false);
        onBrlRetryRequired?.();
        return;
      }

      const message = error.message || 'Payment could not be completed.';
      setPaymentError(message);
      onError?.(message);
      setLoading(false);
      return;
    }

    if (paymentIntent?.status === 'succeeded') {
      try {
        await completeSuccessfulPayment(paymentIntent.id);
      } catch (err) {
        const message = err.message || 'Payment succeeded but order confirmation failed.';
        setPaymentError(message);
        onError?.(message);
        setLoading(false);
      }
      return;
    }

    setLoading(false);
  };

  const payLabel = `Pay ${formatChargeAmount(chargeAmount, currency)} — Complete Order`;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {currency === 'BRL' && (
        <div className="p-3 bg-wine/5 border border-gold/30 text-ink font-body text-sm">
          Seu cartão brasileiro só pode ser cobrado em reais. Confirme os dados do cartão
          para pagar <span className="font-medium text-wine">{formatChargeAmount(chargeAmount, 'BRL')}</span>.
        </div>
      )}

      <PaymentElement
        options={{
          layout: 'tabs',
          fields: {
            billingDetails: {
              name: 'never',
              email: 'never',
              phone: 'auto',
              address: {
                country: 'never',
                line1: 'never',
                line2: 'never',
                city: 'never',
                state: 'never',
                postalCode: 'never',
              },
            },
          },
          wallets: {
            applePay: 'never',
            googlePay: 'never',
          },
        }}
      />

      {paymentError && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-800 font-body text-sm">
          {paymentError}
        </div>
      )}

      <div className="flex items-center gap-3 py-3 border-y border-taupe/20">
        <ShieldCheck size={18} strokeWidth={1.5} className="text-gold flex-shrink-0" />
        <p className="font-body text-xs text-ink-subtle">
          Your payment is processed securely by Stripe. We never store your card details.
        </p>
      </div>

      <motion.button
        type="submit"
        disabled={loading || !stripe || !elements}
        whileTap={{ scale: 0.98 }}
        className={`btn-primary w-full ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <motion.span
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
              className="w-4 h-4 border-2 border-cream border-t-transparent rounded-full inline-block"
            />
            Processing...
          </span>
        ) : (
          <>
            <Lock size={14} strokeWidth={2} />
            {payLabel}
          </>
        )}
      </motion.button>
    </form>
  );
}
