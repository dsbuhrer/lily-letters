import { useState, useRef, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, ChevronRight, Check, Mail } from 'lucide-react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import useCartStore from '../store/cartStore';
import CheckoutEmailNotice from '../components/CheckoutEmailNotice';
import CheckoutPaymentForm from '../components/CheckoutPaymentForm';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { clearCheckoutSession } from '../lib/stripeCheckout';
import {
  normalizeEmail,
  isValidEmail,
  suggestEmailFix,
} from '../utils/emailHelpers';

const inputBase = 'input-field';
const stripePromise = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)
  : null;

export default function CheckoutPage() {
  const { items, clearCart } = useCartStore();
  const { user } = useAuth();
  const navigate = useNavigate();
  const subtotal = items.reduce((s, i) => s + i.price, 0);

  const [step, setStep] = useState(1); // 1: contact, 2: billing, 3: payment

  const [info, setInfo] = useState({
    email: '',
    firstName: '',
    lastName: '',
  });
  const [billing, setBilling] = useState({
    street: '',
    postalCode: '',
    city: '',
    stateProvince: '',
    country: 'US',
  });
  const [billingErrors, setBillingErrors] = useState({});
  const [paymentSession, setPaymentSession] = useState({
    clientSecret: null,
    orderNumber: null,
    paymentIntentId: null,
    loading: false,
    error: null,
  });

  const emailLocked = Boolean(user?.email);

  useEffect(() => {
    if (user?.email) {
      setInfo((prev) => ({ ...prev, email: user.email }));
      setShowDeliveryPreview(true);
      setEmailTouched(true);
      setEmailError('');
    }
  }, [user?.email]);

  const emailInputRef = useRef(null);
  const [emailTouched, setEmailTouched] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [emailSuggestion, setEmailSuggestion] = useState(null);
  const [showDeliveryPreview, setShowDeliveryPreview] = useState(false);
  const [emailShake, setEmailShake] = useState(false);
  const [showTypoPromptOnSubmit, setShowTypoPromptOnSubmit] = useState(false);

  const getEmailInputClass = () => {
    let cls = inputBase;
    if (emailTouched && emailError) cls += ' input-field-error';
    else if (emailTouched && isValidEmail(info.email)) cls += ' input-field-valid';
    return cls;
  };

  const handleEmailBlur = () => {
    const normalized = normalizeEmail(info.email);
    if (normalized !== info.email) {
      setInfo((prev) => ({ ...prev, email: normalized }));
    }
    setEmailTouched(true);
    if (!normalized) {
      setEmailError('Please enter your email address.');
      setShowDeliveryPreview(false);
      setEmailSuggestion(null);
      return;
    }
    if (!isValidEmail(normalized)) {
      setEmailError('Please enter a valid email address.');
      setShowDeliveryPreview(false);
      setEmailSuggestion(null);
      return;
    }
    setEmailError('');
    setEmailSuggestion(suggestEmailFix(normalized));
    setShowDeliveryPreview(true);
    setShowTypoPromptOnSubmit(false);
  };

  const handleEmailChange = (value) => {
    if (emailLocked) return;
    setInfo((prev) => ({ ...prev, email: value }));
    if (emailError) setEmailError('');
    setShowTypoPromptOnSubmit(false);
    const suggestion = suggestEmailFix(value);
    setEmailSuggestion(suggestion);
    if (!value.trim()) setShowDeliveryPreview(false);
  };

  const applyEmailSuggestion = () => {
    if (!emailSuggestion) return;
    setInfo((prev) => ({ ...prev, email: emailSuggestion }));
    setEmailSuggestion(null);
    setShowTypoPromptOnSubmit(false);
    setShowDeliveryPreview(true);
    setEmailError('');
  };

  const goToStep = (nextStep) => {
    if (step === 3 && nextStep < 3) {
      setPaymentSession({
        clientSecret: null,
        orderNumber: null,
        paymentIntentId: null,
        loading: false,
        error: null,
      });
    }
    setStep(nextStep);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const buildOrderPayload = () => ({
    email: info.email,
    firstName: info.firstName,
    lastName: info.lastName,
    items: items.map((item) => ({
      productId: item.id,
      name: item.name,
      price: item.price,
      slug: item.slug,
    })),
    billing: {
      street: billing.street.trim(),
      postalCode: billing.postalCode.trim(),
      city: billing.city.trim(),
      stateProvince: billing.stateProvince.trim(),
      country: billing.country,
    },
    userId: user?.id,
  });

  const startPaymentSession = async () => {
    if (!stripePromise) {
      setPaymentSession((prev) => ({
        ...prev,
        loading: false,
        error: 'Stripe is not configured. Add VITE_STRIPE_PUBLISHABLE_KEY to your environment.',
      }));
      return;
    }

    setPaymentSession({
      clientSecret: null,
      orderNumber: null,
      paymentIntentId: null,
      loading: true,
      error: null,
    });

    try {
      const result = await api.createOrder(buildOrderPayload());
      setPaymentSession({
        clientSecret: result.clientSecret,
        orderNumber: result.orderId,
        paymentIntentId: result.paymentIntentId,
        loading: false,
        error: null,
      });
    } catch (err) {
      setPaymentSession({
        clientSecret: null,
        orderNumber: null,
        paymentIntentId: null,
        loading: false,
        error: err.message || 'Could not start payment. Please try again.',
      });
    }
  };

  const proceedToBilling = () => {
    const normalized = normalizeEmail(info.email);
    setInfo((prev) => ({ ...prev, email: normalized }));
    setShowTypoPromptOnSubmit(false);
    goToStep(2);
  };

  const validateBilling = () => {
    const errors = {};
    const street = billing.street.trim();
    const postalCode = billing.postalCode.trim();
    const city = billing.city.trim();
    const stateProvince = billing.stateProvince.trim();
    const country = billing.country.trim();

    if (!street) errors.street = 'Please enter your street address.';
    if (!postalCode) errors.postalCode = 'Please enter your ZIP or postal code.';
    if (!city) errors.city = 'Please enter your city.';
    if (!stateProvince) errors.stateProvince = 'Please enter your state or province.';
    if (!country) errors.country = 'Please select your country.';

    setBillingErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const proceedToPayment = async () => {
    if (!validateBilling()) return;
    goToStep(3);
    await startPaymentSession();
  };

  const handleInfoSubmit = (e) => {
    e.preventDefault();
    const normalized = normalizeEmail(info.email);
    setEmailTouched(true);

    if (!isValidEmail(normalized)) {
      setEmailError('Please enter a valid email address.');
      setEmailShake(true);
      setTimeout(() => setEmailShake(false), 500);
      emailInputRef.current?.focus();
      return;
    }

    const suggestion = suggestEmailFix(normalized);
    if (suggestion && !showTypoPromptOnSubmit) {
      setEmailSuggestion(suggestion);
      setShowTypoPromptOnSubmit(true);
      return;
    }

    proceedToBilling();
  };

  const handleBillingSubmit = async (e) => {
    e.preventDefault();
    await proceedToPayment();
  };

  const updateBilling = (field, value) => {
    setBilling((prev) => ({ ...prev, [field]: value }));
    if (billingErrors[field]) {
      setBillingErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handlePaymentSuccess = (result) => {
    clearCart();
    clearCheckoutSession();
    navigate('/order-confirmation', {
      state: {
        email: result.email,
        firstName: result.firstName,
        orderId: result.orderId,
        orderItems: result.items,
        total: result.total,
        status: result.status,
      },
    });
  };

  const stripeElementsOptions = useMemo(
    () =>
      paymentSession.clientSecret
        ? {
            clientSecret: paymentSession.clientSecret,
            appearance: {
              theme: 'stripe',
              variables: {
                colorPrimary: '#5c2430',
                colorText: '#2c2420',
                fontFamily: 'Inter, system-ui, sans-serif',
              },
            },
          }
        : null,
    [paymentSession.clientSecret],
  );

  if (items.length === 0) {
    return (
      <main className="min-h-screen bg-cream pt-24 flex items-center justify-center">
        <div className="text-center">
          <p className="font-display text-2xl text-wine mb-2">Your cart is empty</p>
          <Link to="/products" className="btn-primary mt-4 inline-flex">
            Browse Templates
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f8f5ef] pt-20">
      <div className="max-w-6xl mx-auto px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <Link to="/" className="block">
            <img
              src="/logos/logo-horizontal.svg"
              alt="The Lily Letters Co"
              className="h-12"
            />
          </Link>
          <div className="flex items-center gap-2 text-xs font-body text-ink-subtle">
            <Lock size={12} strokeWidth={1.5} />
            Secure Checkout
          </div>
        </div>

        {/* Steps indicator — click completed steps to go back */}
        <nav aria-label="Checkout progress" className="flex flex-wrap items-center gap-3 mb-10">
          {['Contact', 'Billing', 'Payment'].map((label, i) => {
            const targetStep = i + 1;
            const isComplete = step > targetStep;
            const isCurrent = step === targetStep;
            const canNavigateBack = targetStep < step;

            const circleClass = `w-7 h-7 rounded-full flex items-center justify-center text-xs font-body font-medium transition-colors ${
              isComplete
                ? 'bg-sage text-cream'
                : isCurrent
                  ? 'bg-wine text-cream'
                  : 'bg-taupe/30 text-ink-faint'
            }`;

            const labelClass = `font-body text-sm font-medium transition-colors ${
              isCurrent ? 'text-wine' : isComplete ? 'text-ink-muted' : 'text-ink-faint'
            }`;

            const stepContent = (
              <>
                <div className={circleClass}>
                  {isComplete ? <Check size={12} strokeWidth={2.5} /> : targetStep}
                </div>
                <span className={labelClass}>{label}</span>
              </>
            );

            return (
              <div key={label} className="flex items-center gap-3">
                {canNavigateBack ? (
                  <button
                    type="button"
                    onClick={() => goToStep(targetStep)}
                    className="flex items-center gap-2 rounded-sm hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-[#f8f5ef]"
                    aria-label={`Go back to ${label}`}
                  >
                    {stepContent}
                  </button>
                ) : (
                  <div
                    className="flex items-center gap-2"
                    aria-current={isCurrent ? 'step' : undefined}
                  >
                    {stepContent}
                  </div>
                )}
                {i < 2 && (
                  <ChevronRight size={14} className="text-taupe" aria-hidden />
                )}
              </div>
            );
          })}
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
          {/* Form */}
          <div className="lg:col-span-3">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <h2 className="font-display text-2xl font-light text-wine mb-6">
                    Contact Information
                  </h2>
                  <form onSubmit={handleInfoSubmit} className="space-y-4">
                    <CheckoutEmailNotice />

                    <div>
                      <label
                        htmlFor="checkout-email"
                        className="form-label"
                      >
                        Email for your download & receipt *
                      </label>
                      <motion.input
                        ref={emailInputRef}
                        id="checkout-email"
                        type="email"
                        required
                        autoComplete="email"
                        placeholder="you@email.com"
                        value={info.email}
                        onChange={(e) => handleEmailChange(e.target.value)}
                        onBlur={handleEmailBlur}
                        disabled={emailLocked}
                        readOnly={emailLocked}
                        animate={emailShake ? { x: [0, -6, 6, -4, 4, 0] } : { x: 0 }}
                        transition={{ duration: 0.4 }}
                        className={getEmailInputClass()}
                      />

                      {emailTouched && emailError && (
                        <p className="font-body text-xs text-red-600/90 mt-1.5" role="alert">
                          {emailError}
                        </p>
                      )}

                      <AnimatePresence>
                        {emailSuggestion && !showTypoPromptOnSubmit && (
                          <motion.div
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            className="mt-2 flex flex-wrap items-center gap-2"
                          >
                            <span className="font-body text-xs text-ink-subtle">
                              Did you mean{' '}
                              <span className="font-medium text-wine">{emailSuggestion}</span>?
                            </span>
                            <button
                              type="button"
                              onClick={applyEmailSuggestion}
                              className="font-body text-xs px-2.5 py-1 bg-wine/10 text-wine hover:bg-wine/15 transition-colors"
                            >
                              Use suggestion
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <AnimatePresence>
                        {showTypoPromptOnSubmit && emailSuggestion && (
                          <motion.div
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            className="mt-2 p-3 bg-gold/10 border border-gold/30"
                          >
                            <p className="font-body text-xs text-ink-muted mb-2">
                              Before you continue: did you mean{' '}
                              <strong className="text-wine">{emailSuggestion}</strong>?
                            </p>
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={applyEmailSuggestion}
                                className="font-body text-xs px-3 py-1.5 bg-wine text-cream hover:bg-[#3a1926] transition-colors"
                              >
                                Use suggestion
                              </button>
                              <button
                                type="button"
                                onClick={proceedToBilling}
                                className="font-body text-xs px-3 py-1.5 border border-taupe text-ink-muted hover:border-wine hover:text-wine transition-colors"
                              >
                                Keep as entered
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {emailLocked && (
                        <p className="font-body text-xs text-ink-subtle mt-2">
                          Signed in as{' '}
                          <strong className="text-wine font-medium">{info.email}</strong>
                        </p>
                      )}

                      <AnimatePresence>
                        {showDeliveryPreview && isValidEmail(info.email) && !emailError && (
                          <motion.p
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="font-body text-xs text-ink-subtle mt-2 leading-relaxed"
                          >
                            We&apos;ll send your download to{' '}
                            <strong className="text-wine font-medium">
                              {normalizeEmail(info.email)}
                            </strong>
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="form-label">
                          First Name *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="First name"
                          value={info.firstName}
                          onChange={(e) => setInfo({ ...info, firstName: e.target.value })}
                          className={inputBase}
                        />
                      </div>
                      <div>
                        <label className="form-label">
                          Last Name *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Last name"
                          value={info.lastName}
                          onChange={(e) => setInfo({ ...info, lastName: e.target.value })}
                          className={inputBase}
                        />
                      </div>
                    </div>

                    <div className="pt-2 border-t border-taupe/20">
                      <p className="font-body text-xs text-ink-faint mb-4">
                        ℹ️ You can create an account after completing your purchase to manage your downloads.
                      </p>
                      <button type="submit" className="btn-primary w-full">
                        Continue to Billing
                        <ChevronRight size={16} strokeWidth={2} />
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step2-billing"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="font-display text-2xl font-light text-wine">
                      Billing Address
                    </h2>
                    <button
                      type="button"
                      onClick={() => goToStep(1)}
                      className="font-body text-xs text-ink-subtle hover:text-wine transition-colors"
                    >
                      ← Edit Contact
                    </button>
                  </div>

                  <form onSubmit={handleBillingSubmit} className="space-y-4" noValidate>
                    <p className="font-body text-sm text-ink-muted -mt-2 mb-2">
                      Required for card verification. We only ship digital downloads — nothing is mailed to this address.
                    </p>

                    <div>
                      <label
                        htmlFor="billing-street"
                        className="form-label"
                      >
                        Street *
                      </label>
                      <input
                        id="billing-street"
                        type="text"
                        autoComplete="billing street-address"
                        placeholder="123 Main Street, Apt 4"
                        value={billing.street}
                        onChange={(e) => updateBilling('street', e.target.value)}
                        className={
                          billingErrors.street ? `${inputBase} input-field-error` : inputBase
                        }
                        aria-invalid={Boolean(billingErrors.street)}
                      />
                      {billingErrors.street && (
                        <p className="font-body text-xs text-red-600/90 mt-1.5" role="alert">
                          {billingErrors.street}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="billing-postal"
                          className="form-label"
                        >
                          ZIP / Postal Code *
                        </label>
                        <input
                          id="billing-postal"
                          type="text"
                          autoComplete="billing postal-code"
                          placeholder={billing.country === 'BR' ? '00000-000' : '10001'}
                          value={billing.postalCode}
                          onChange={(e) => updateBilling('postalCode', e.target.value)}
                          className={
                            billingErrors.postalCode ? `${inputBase} input-field-error` : inputBase
                          }
                          aria-invalid={Boolean(billingErrors.postalCode)}
                        />
                        {billingErrors.postalCode && (
                          <p className="font-body text-xs text-red-600/90 mt-1.5" role="alert">
                            {billingErrors.postalCode}
                          </p>
                        )}
                      </div>
                      <div>
                        <label
                          htmlFor="billing-city"
                          className="form-label"
                        >
                          City *
                        </label>
                        <input
                          id="billing-city"
                          type="text"
                          autoComplete="billing address-level2"
                          placeholder="City"
                          value={billing.city}
                          onChange={(e) => updateBilling('city', e.target.value)}
                          className={
                            billingErrors.city ? `${inputBase} input-field-error` : inputBase
                          }
                          aria-invalid={Boolean(billingErrors.city)}
                        />
                        {billingErrors.city && (
                          <p className="font-body text-xs text-red-600/90 mt-1.5" role="alert">
                            {billingErrors.city}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="billing-state"
                          className="form-label"
                        >
                          State / Province *
                        </label>
                        <input
                          id="billing-state"
                          type="text"
                          autoComplete="billing address-level1"
                          placeholder={billing.country === 'US' ? 'NY' : 'State or province'}
                          value={billing.stateProvince}
                          onChange={(e) => updateBilling('stateProvince', e.target.value)}
                          className={
                            billingErrors.stateProvince ? `${inputBase} input-field-error` : inputBase
                          }
                          aria-invalid={Boolean(billingErrors.stateProvince)}
                        />
                        {billingErrors.stateProvince && (
                          <p className="font-body text-xs text-red-600/90 mt-1.5" role="alert">
                            {billingErrors.stateProvince}
                          </p>
                        )}
                      </div>
                      <div>
                        <label
                          htmlFor="billing-country"
                          className="form-label"
                        >
                          Country *
                        </label>
                        <select
                          id="billing-country"
                          autoComplete="billing country"
                          value={billing.country}
                          onChange={(e) => updateBilling('country', e.target.value)}
                          className={
                            billingErrors.country ? `${inputBase} input-field-error` : inputBase
                          }
                          aria-invalid={Boolean(billingErrors.country)}
                        >
                          <option value="US">United States</option>
                          <option value="CA">Canada</option>
                          <option value="GB">United Kingdom</option>
                          <option value="AU">Australia</option>
                          <option value="BR">Brazil</option>
                          <option value="MX">Mexico</option>
                          <option value="DE">Germany</option>
                          <option value="FR">France</option>
                          <option value="IT">Italy</option>
                          <option value="ES">Spain</option>
                          <option value="PT">Portugal</option>
                          <option value="OTHER">Other</option>
                        </select>
                        {billingErrors.country && (
                          <p className="font-body text-xs text-red-600/90 mt-1.5" role="alert">
                            {billingErrors.country}
                          </p>
                        )}
                      </div>
                    </div>

                    <button type="submit" className="btn-primary w-full mt-2">
                      Continue to Payment
                      <ChevronRight size={16} strokeWidth={2} />
                    </button>
                  </form>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div
                  key="step3-payment"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="font-display text-2xl font-light text-wine">
                      Payment Details
                    </h2>
                    <button
                      type="button"
                      onClick={() => goToStep(2)}
                      className="font-body text-xs text-ink-subtle hover:text-wine transition-colors"
                    >
                      ← Edit Billing
                    </button>
                  </div>

                  {/* Delivery email confirmation */}
                  <div className="bg-wine/5 border border-gold/30 p-4 mb-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex gap-3 min-w-0">
                        <Mail size={18} strokeWidth={1.5} className="text-gold flex-shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <p className="font-body text-xs text-ink-subtle uppercase tracking-wider mb-0.5">
                            Delivery email
                          </p>
                          <p className="font-body text-sm font-medium text-wine break-all">
                            {info.email}
                          </p>
                          <p className="font-body text-xs text-ink-muted mt-1.5 leading-relaxed">
                            {emailLocked
                              ? 'Receipt and download details will be sent to your account email.'
                              : 'Your templates will be sent here — tap Change if this looks wrong.'}
                          </p>
                        </div>
                      </div>
                      {!emailLocked && (
                        <button
                          type="button"
                          onClick={() => goToStep(1)}
                          className="font-body text-xs text-gold hover:text-wine flex-shrink-0 transition-colors"
                        >
                          Change
                        </button>
                      )}
                    </div>
                  </div>

                  {paymentSession.loading && (
                    <div className="py-12 text-center">
                      <motion.span
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                        className="w-8 h-8 border-2 border-wine border-t-transparent rounded-full inline-block"
                      />
                      <p className="font-body text-sm text-ink-subtle mt-4">
                        Preparing secure payment…
                      </p>
                    </div>
                  )}

                  {paymentSession.error && (
                    <div className="p-4 mb-4 bg-red-50 border border-red-200 text-red-800 font-body text-sm">
                      {paymentSession.error}
                      <button
                        type="button"
                        onClick={startPaymentSession}
                        className="block mt-3 font-body text-xs text-wine underline"
                      >
                        Try again
                      </button>
                    </div>
                  )}

                  {!paymentSession.loading &&
                    !paymentSession.error &&
                    stripeElementsOptions &&
                    stripePromise && (
                      <Elements stripe={stripePromise} options={stripeElementsOptions}>
                        <CheckoutPaymentForm
                          orderNumber={paymentSession.orderNumber}
                          paymentIntentId={paymentSession.paymentIntentId}
                          email={info.email}
                          firstName={info.firstName}
                          lastName={info.lastName}
                          billing={billing}
                          subtotal={subtotal}
                          userId={user?.id}
                          onSuccess={handlePaymentSuccess}
                        />
                      </Elements>
                    )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-2">
            <div className="panel p-6 shadow-panel sticky top-28">
              <h3 className="font-body text-xs uppercase tracking-widest text-gold font-medium mb-5">
                Order Summary
              </h3>

              <div className="space-y-3 mb-5">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-3 items-center">
                    <img
                      src={item.images[0]}
                      alt={item.name}
                      className="w-14 h-14 object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-body text-sm text-ink truncate">{item.name}</p>
                      <p className="font-body text-xs text-ink-faint">Digital Download</p>
                    </div>
                    <span className="font-body text-sm font-medium text-wine">
                      ${item.price.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="space-y-2 pt-4 border-t border-taupe/20">
                <div className="flex justify-between font-body text-sm">
                  <span className="text-ink-subtle">Subtotal</span>
                  <span className="text-ink">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-body text-sm">
                  <span className="text-ink-subtle">Shipping</span>
                  <span className="text-sage font-medium">Free (Digital)</span>
                </div>
                <div className="flex justify-between pt-3 border-t border-taupe/20">
                  <span className="font-display text-lg font-light text-wine">Total</span>
                  <span className="font-display text-2xl font-light text-wine">
                    ${subtotal.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="mt-4 space-y-1.5">
                <p className="font-body text-xs text-ink-subtle flex items-start gap-1.5">
                  <Check size={11} className="text-sage flex-shrink-0 mt-0.5" />
                  {step === 3 && info.email ? (
                    <>
                      Instant download + email sent to{' '}
                      <span className="text-wine font-medium break-all">{info.email}</span>
                    </>
                  ) : (
                    'Instant download + email sent to the address you enter'
                  )}
                </p>
                <p className="font-body text-xs text-ink-subtle flex items-center gap-1.5">
                  <Check size={11} className="text-sage" />
                  Instant PDF download after payment
                </p>
                <p className="font-body text-xs text-ink-subtle flex items-center gap-1.5">
                  <Check size={11} className="text-sage" />
                  PDF with all Canva links included
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
