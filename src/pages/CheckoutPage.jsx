import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, CreditCard, ChevronRight, Check, ShieldCheck, Mail } from 'lucide-react';
import useCartStore from '../store/cartStore';
import CheckoutEmailNotice from '../components/CheckoutEmailNotice';
import {
  normalizeEmail,
  isValidEmail,
  suggestEmailFix,
} from '../utils/emailHelpers';

const inputClass =
  'w-full border border-taupe bg-white px-4 py-3 text-sm font-body text-[#2d2020] placeholder-[#a89c96] focus:outline-none focus:border-gold transition-colors duration-200';

export default function CheckoutPage() {
  const { items, clearCart } = useCartStore();
  const navigate = useNavigate();
  const subtotal = items.reduce((s, i) => s + i.price, 0);

  const [step, setStep] = useState(1); // 1: info, 2: payment
  const [loading, setLoading] = useState(false);

  const [info, setInfo] = useState({
    email: '',
    firstName: '',
    lastName: '',
  });
  const [payment, setPayment] = useState({
    cardNumber: '',
    expiry: '',
    cvv: '',
    nameOnCard: '',
  });

  const emailInputRef = useRef(null);
  const [emailTouched, setEmailTouched] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [emailSuggestion, setEmailSuggestion] = useState(null);
  const [showDeliveryPreview, setShowDeliveryPreview] = useState(false);
  const [emailShake, setEmailShake] = useState(false);
  const [showTypoPromptOnSubmit, setShowTypoPromptOnSubmit] = useState(false);

  const getEmailInputClass = () => {
    let cls = inputClass;
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

  const proceedToPayment = () => {
    const normalized = normalizeEmail(info.email);
    setInfo((prev) => ({ ...prev, email: normalized }));
    setStep(2);
    setShowTypoPromptOnSubmit(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

    proceedToPayment();
  };

  const handlePaymentSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    // Mock processing
    setTimeout(() => {
      clearCart();
      navigate('/order-confirmation', {
        state: {
          email: info.email,
          firstName: info.firstName,
          items,
          total: subtotal,
          orderId: `TLLC-${Date.now().toString(36).toUpperCase()}`,
        },
      });
    }, 2000);
  };

  const formatCard = (val) => {
    const digits = val.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(.{4})/g, '$1 ').trim();
  };

  const formatExpiry = (val) => {
    const digits = val.replace(/\D/g, '').slice(0, 4);
    if (digits.length >= 3) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return digits;
  };

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
          <div className="flex items-center gap-2 text-xs font-body text-[#2d2020]/50">
            <Lock size={12} strokeWidth={1.5} />
            Secure Checkout
          </div>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center gap-3 mb-10">
          {['Contact', 'Payment'].map((label, i) => (
            <div key={label} className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-body font-medium transition-colors ${
                    step > i + 1
                      ? 'bg-sage text-cream'
                      : step === i + 1
                      ? 'bg-wine text-cream'
                      : 'bg-taupe/30 text-[#2d2020]/40'
                  }`}
                >
                  {step > i + 1 ? <Check size={12} strokeWidth={2.5} /> : i + 1}
                </div>
                <span
                  className={`font-body text-sm font-medium ${
                    step === i + 1 ? 'text-wine' : 'text-[#2d2020]/40'
                  }`}
                >
                  {label}
                </span>
              </div>
              {i < 1 && <ChevronRight size={14} className="text-taupe" />}
            </div>
          ))}
        </div>

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
                        className="block font-body text-xs uppercase tracking-wider text-[#2d2020]/60 mb-1.5"
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
                            <span className="font-body text-xs text-[#2d2020]/60">
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
                            <p className="font-body text-xs text-[#2d2020]/70 mb-2">
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
                                onClick={proceedToPayment}
                                className="font-body text-xs px-3 py-1.5 border border-taupe text-[#2d2020]/70 hover:border-wine hover:text-wine transition-colors"
                              >
                                Keep as entered
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <AnimatePresence>
                        {showDeliveryPreview && isValidEmail(info.email) && !emailError && (
                          <motion.p
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="font-body text-xs text-[#2d2020]/60 mt-2 leading-relaxed"
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
                        <label className="block font-body text-xs uppercase tracking-wider text-[#2d2020]/60 mb-1.5">
                          First Name *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="First name"
                          value={info.firstName}
                          onChange={(e) => setInfo({ ...info, firstName: e.target.value })}
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className="block font-body text-xs uppercase tracking-wider text-[#2d2020]/60 mb-1.5">
                          Last Name *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Last name"
                          value={info.lastName}
                          onChange={(e) => setInfo({ ...info, lastName: e.target.value })}
                          className={inputClass}
                        />
                      </div>
                    </div>

                    <div className="pt-2 border-t border-taupe/20">
                      <p className="font-body text-xs text-[#2d2020]/40 mb-4">
                        ℹ️ You can create an account after completing your purchase to manage your downloads.
                      </p>
                      <button type="submit" className="btn-primary w-full">
                        Continue to Payment
                        <ChevronRight size={16} strokeWidth={2} />
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="font-display text-2xl font-light text-wine">
                      Payment Details
                    </h2>
                    <button
                      onClick={() => setStep(1)}
                      className="font-body text-xs text-[#2d2020]/50 hover:text-wine transition-colors"
                    >
                      ← Edit Info
                    </button>
                  </div>

                  {/* Delivery email confirmation */}
                  <div className="bg-wine/5 border border-gold/30 p-4 mb-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex gap-3 min-w-0">
                        <Mail size={18} strokeWidth={1.5} className="text-gold flex-shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <p className="font-body text-xs text-[#2d2020]/50 uppercase tracking-wider mb-0.5">
                            Delivery email
                          </p>
                          <p className="font-body text-sm font-medium text-wine break-all">
                            {info.email}
                          </p>
                          <p className="font-body text-xs text-[#2d2020]/55 mt-1.5 leading-relaxed">
                            Your templates will be sent here — tap Change if this looks wrong.
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="font-body text-xs text-gold hover:text-wine flex-shrink-0 transition-colors"
                      >
                        Change
                      </button>
                    </div>
                  </div>

                  <form onSubmit={handlePaymentSubmit} className="space-y-4">
                    <div>
                      <label className="block font-body text-xs uppercase tracking-wider text-[#2d2020]/60 mb-1.5">
                        Card Number *
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          placeholder="1234 5678 9012 3456"
                          value={payment.cardNumber}
                          onChange={(e) =>
                            setPayment({ ...payment, cardNumber: formatCard(e.target.value) })
                          }
                          maxLength={19}
                          className={`${inputClass} pr-12`}
                        />
                        <CreditCard
                          size={18}
                          strokeWidth={1.5}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-taupe"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block font-body text-xs uppercase tracking-wider text-[#2d2020]/60 mb-1.5">
                          Expiry Date *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="MM/YY"
                          value={payment.expiry}
                          onChange={(e) =>
                            setPayment({ ...payment, expiry: formatExpiry(e.target.value) })
                          }
                          maxLength={5}
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className="block font-body text-xs uppercase tracking-wider text-[#2d2020]/60 mb-1.5">
                          CVV *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="123"
                          value={payment.cvv}
                          onChange={(e) =>
                            setPayment({
                              ...payment,
                              cvv: e.target.value.replace(/\D/g, '').slice(0, 4),
                            })
                          }
                          maxLength={4}
                          className={inputClass}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-body text-xs uppercase tracking-wider text-[#2d2020]/60 mb-1.5">
                        Name on Card *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="As it appears on your card"
                        value={payment.nameOnCard}
                        onChange={(e) => setPayment({ ...payment, nameOnCard: e.target.value })}
                        className={inputClass}
                      />
                    </div>

                    {/* Trust badges */}
                    <div className="flex items-center gap-3 py-3 border-y border-taupe/20">
                      <ShieldCheck size={18} strokeWidth={1.5} className="text-gold flex-shrink-0" />
                      <p className="font-body text-xs text-[#2d2020]/50">
                        Your payment is protected by 256-bit SSL encryption. We never store your card details.
                      </p>
                    </div>

                    <motion.button
                      type="submit"
                      disabled={loading}
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
                          Pay ${subtotal.toFixed(2)} — Complete Order
                        </>
                      )}
                    </motion.button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-2">
            <div className="bg-white border border-taupe/20 p-6 sticky top-28">
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
                      <p className="font-body text-sm text-[#2d2020] truncate">{item.name}</p>
                      <p className="font-body text-xs text-[#2d2020]/40">Digital Download</p>
                    </div>
                    <span className="font-body text-sm font-medium text-wine">
                      ${item.price.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="space-y-2 pt-4 border-t border-taupe/20">
                <div className="flex justify-between font-body text-sm">
                  <span className="text-[#2d2020]/60">Subtotal</span>
                  <span className="text-[#2d2020]">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-body text-sm">
                  <span className="text-[#2d2020]/60">Shipping</span>
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
                <p className="font-body text-xs text-[#2d2020]/50 flex items-start gap-1.5">
                  <Check size={11} className="text-sage flex-shrink-0 mt-0.5" />
                  {step === 2 && info.email ? (
                    <>
                      Instant download + email sent to{' '}
                      <span className="text-wine font-medium break-all">{info.email}</span>
                    </>
                  ) : (
                    'Instant download + email sent to the address you enter'
                  )}
                </p>
                <p className="font-body text-xs text-[#2d2020]/50 flex items-center gap-1.5">
                  <Check size={11} className="text-sage" />
                  Instant PDF download after payment
                </p>
                <p className="font-body text-xs text-[#2d2020]/50 flex items-center gap-1.5">
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
