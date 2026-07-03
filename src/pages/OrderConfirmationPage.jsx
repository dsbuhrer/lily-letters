import { useEffect, useState } from 'react';
import { useLocation, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Download, Mail, Check, ExternalLink, User, ArrowRight, AlertCircle } from 'lucide-react';
import { useUiFeedback } from '../context/UiFeedbackContext';
import { useAuth } from '../context/AuthContext';
import { isEmailConfirmed } from '../lib/authEmail';
import useCartStore from '../store/cartStore';
import { getOrderConfirmation } from '../lib/supabase/orders';
import {
  downloadOrderPdfs,
  downloadOrderLinksPdf,
  orderHasPdfDownload,
  orderHasLegacyCanvaDownload,
} from '../lib/orderDownloads';
import {
  clearCheckoutSession,
  readCheckoutSession,
} from '../lib/stripeCheckout';

export default function OrderConfirmationPage() {
  const { clearCart } = useCartStore();
  const { toast } = useUiFeedback();
  const { signUp, configured, user } = useAuth();
  const navigate = useNavigate();
  const { state } = useLocation();
  const [searchParams] = useSearchParams();
  const [showAccountPrompt, setShowAccountPrompt] = useState(false);
  const [accountCreated, setAccountCreated] = useState(false);
  const [password, setPassword] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [loadingOrder, setLoadingOrder] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [order, setOrder] = useState(null);

  const queryOrderNumber = searchParams.get('order');
  const redirectPaymentIntentId =
    searchParams.get('payment_intent') || searchParams.get('payment_intent_id');

  useEffect(() => {
    if (user && isEmailConfirmed(user)) {
      setAccountCreated(true);
      return undefined;
    }
    const timer = setTimeout(() => setShowAccountPrompt(true), 1500);
    return () => clearTimeout(timer);
  }, [user]);

  useEffect(() => {
    let cancelled = false;

    async function loadOrder() {
      setLoadingOrder(true);
      setLoadError('');

      const session = readCheckoutSession();
      const orderNumber = queryOrderNumber || state?.orderId || session?.orderNumber;
      const email = state?.email || session?.email || user?.email || '';
      const paymentIntentId = redirectPaymentIntentId || session?.paymentIntentId || null;

      if (!orderNumber || !email) {
        if (!cancelled) {
          setLoadError('We could not find your order details. Please check your email or contact support.');
          setLoadingOrder(false);
        }
        return;
      }

      try {
        const result = await getOrderConfirmation({
          orderNumber,
          email,
          userId: user?.id,
          paymentIntentId,
        });

        if (cancelled) return;

        if (result.status === 'paid') {
          clearCheckoutSession();
          clearCart();
        }

        setOrder({
          email: result.email,
          firstName: result.firstName || state?.firstName || 'there',
          orderId: result.orderId,
          orderItems: result.items,
          total: result.total,
          status: result.status,
          items: (result.items || []).map((item) => ({
            id: item.product_id,
            name: item.product_name,
          })),
        });
      } catch (err) {
        if (!cancelled) {
          setLoadError(err.message || 'Could not load your order.');
        }
      } finally {
        if (!cancelled) setLoadingOrder(false);
      }
    }

    loadOrder();
    return () => {
      cancelled = true;
    };
  }, [queryOrderNumber, redirectPaymentIntentId, state, user?.email, user?.id]);

  const handleCreateAccount = async (e) => {
    e.preventDefault();
    if (!configured || !order) {
      toast.info('Account system is not configured yet.');
      return;
    }
    setCreating(true);
    setCreateError('');
    try {
      const { session, user: newUser } = await signUp(order.email, password, {
        firstName: order.firstName,
      });
      if (session && newUser?.email_confirmed_at) {
        setAccountCreated(true);
        toast.success('Account created! Your purchases are saved.');
        setTimeout(() => navigate('/account'), 1500);
      } else {
        toast.info('Check your email to confirm your account. Purchases link after you confirm.');
      }
    } catch (err) {
      setCreateError(err.message || 'Could not create account');
    } finally {
      setCreating(false);
    }
  };

  const buildOrderForDownload = () => ({
    order_number: order.orderId,
    paid_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    order_items: order.orderItems || [],
  });

  const handleDownload = async () => {
    if (!order || order.status !== 'paid') {
      toast.error('Downloads are available after payment is confirmed.');
      return;
    }

    const downloadOrder = buildOrderForDownload();
    const hasPdf = orderHasPdfDownload(downloadOrder);
    const hasLegacy = orderHasLegacyCanvaDownload(downloadOrder);

    if (!hasPdf && !hasLegacy) {
      if (user) {
        navigate('/account');
      } else {
        toast.info('Create an account to access your downloads anytime.');
      }
      return;
    }

    setDownloading(true);
    try {
      if (hasPdf) {
        await downloadOrderPdfs(downloadOrder);
      } else {
        downloadOrderLinksPdf(downloadOrder);
      }
    } catch (err) {
      toast.error(err.message || 'Download failed.');
    } finally {
      setDownloading(false);
    }
  };

  if (loadingOrder) {
    return (
      <main className="min-h-screen bg-cream pt-20 flex items-center justify-center">
        <p className="font-body text-sm text-ink-subtle">Loading your order…</p>
      </main>
    );
  }

  if (loadError || !order) {
    return (
      <main className="min-h-screen bg-cream pt-20">
        <div className="max-w-xl mx-auto px-6 py-16 text-center">
          <div className="w-16 h-16 bg-red-50 border border-red-200 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle size={28} className="text-red-700" />
          </div>
          <h1 className="font-display text-3xl text-wine mb-3">Order unavailable</h1>
          <p className="font-body text-sm text-ink-muted mb-8">{loadError}</p>
          <Link to="/checkout" className="btn-primary inline-flex">
            Return to checkout
          </Link>
        </div>
      </main>
    );
  }

  const isPaid = order.status === 'paid';

  return (
    <main className="min-h-screen bg-cream pt-20">
      <div className="max-w-3xl mx-auto px-6 py-16 text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', damping: 15, stiffness: 200 }}
          className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-8 ${
            isPaid ? 'bg-sage' : 'bg-gold/20'
          }`}
        >
          <motion.div initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}>
            {isPaid ? (
              <Check size={36} strokeWidth={2} className="text-cream" />
            ) : (
              <AlertCircle size={36} strokeWidth={2} className="text-wine" />
            )}
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <p className="section-subtitle mb-3">
            {isPaid ? 'Order Confirmed' : 'Payment Incomplete'}
          </p>
          <h1 className="font-display text-4xl md:text-5xl font-light text-wine mb-3">
            {isPaid ? `Thank You, ${order.firstName}!` : 'Payment not completed'}
          </h1>
          <p className="font-body text-sm text-ink-muted mb-2">
            Order <span className="font-medium text-wine">{order.orderId}</span>
          </p>
          {isPaid ? (
            <p className="font-body text-sm text-ink-subtle">
              A confirmation and your download link have been sent to{' '}
              <span className="text-wine font-medium">{order.email}</span>
            </p>
          ) : (
            <p className="font-body text-sm text-ink-subtle">
              Your payment was not completed. Downloads are not available until payment succeeds.
            </p>
          )}
        </motion.div>

        {isPaid ? (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-10 panel-elevated panel-padding text-left"
          >
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="w-12 h-12 bg-wine/10 flex items-center justify-center">
                <Download size={22} strokeWidth={1.5} className="text-wine" />
              </div>
              <div className="text-left">
                <h2 className="font-display text-xl font-light text-wine">
                  Your Downloads Are Ready
                </h2>
                <p className="font-body text-xs text-ink-subtle">
                  Instant PDF download available
                </p>
              </div>
            </div>

            <div className="bg-cream border border-taupe/30 p-5 mb-6 text-left">
              <p className="font-body text-sm font-medium text-ink mb-3">
                Your Purchase Includes:
              </p>
              <ul className="space-y-2">
                {order.items.length > 0 ? (
                  order.items.map((item) => (
                    <li key={item.id} className="flex items-center gap-2 font-body text-sm text-ink-muted">
                      <Check size={12} className="text-sage flex-shrink-0" />
                      <span>{item.name}</span>
                      <span className="text-gold">— PDF download</span>
                    </li>
                  ))
                ) : (
                  <li className="font-body text-sm text-ink-muted">Your product PDF download</li>
                )}
              </ul>
            </div>

            <p className="font-body text-sm text-ink-muted mb-6 leading-relaxed">
              Click below to download your PDF file(s). Save them to your device for easy access anytime.
            </p>

            <button
              type="button"
              onClick={handleDownload}
              disabled={downloading}
              className="btn-primary w-full justify-center"
            >
              <Download size={16} strokeWidth={1.5} />
              {downloading ? 'Downloading…' : 'Download Your PDF'}
            </button>

            {user && (
              <Link to="/account" className="btn-secondary w-full justify-center mt-3 inline-flex">
                Go to My Account
              </Link>
            )}

            <div className="mt-4 flex items-center justify-center gap-4 text-xs font-body text-ink-faint">
              <span className="flex items-center gap-1">
                <Mail size={11} />
                Receipt sent by Stripe
              </span>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-10 panel panel-padding text-left"
          >
            <p className="font-body text-sm text-ink-muted mb-6">
              If you cancelled payment or your card was declined, you can return to checkout and try again.
              Your cart items are still waiting for you.
            </p>
            <Link to="/checkout" className="btn-primary w-full justify-center inline-flex">
              Return to checkout
            </Link>
          </motion.div>
        )}

        {isPaid && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="mt-8 panel panel-padding text-left"
          >
            <h3 className="font-display text-lg font-light text-wine mb-4">
              How to Use Your Templates
            </h3>
            <div className="space-y-3">
              {[
                'Download your PDF using the button above',
                'Open the file on your computer or mobile device',
                'Print at home or at a local print shop',
                'Keep your download safe — access it anytime from your account',
                'Need help? Contact us anytime via the FAQ or support email',
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-wine/10 text-wine flex items-center justify-center font-body text-xs font-medium flex-shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <p className="font-body text-sm text-ink-muted">{step}</p>
                </div>
              ))}
            </div>
            <Link
              to="/faq"
              className="mt-4 inline-flex items-center gap-1 font-body text-sm text-gold hover:text-wine transition-colors"
            >
              Need help? Visit our FAQ
              <ExternalLink size={12} strokeWidth={1.5} />
            </Link>
          </motion.div>
        )}

        {isPaid && showAccountPrompt && !accountCreated && configured && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="mt-8 bg-wine/5 border border-wine/20 p-6"
          >
            <div className="flex items-center gap-3 mb-3">
              <User size={18} strokeWidth={1.5} className="text-wine" />
              <h3 className="font-display text-lg font-light text-wine">
                Save Your Downloads
              </h3>
            </div>
            <p className="font-body text-sm text-ink-muted mb-4">
              Create a free account to access your downloads anytime and track your orders.
            </p>
            {createError && (
              <p className="font-body text-sm text-red-600 mb-3">{createError}</p>
            )}
            <form onSubmit={handleCreateAccount} className="space-y-3">
              <input
                type="password"
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="input-field"
              />
              <p className="font-body text-xs text-ink-faint">
                Your email: <strong>{order.email}</strong>
              </p>
              <button type="submit" className="btn-primary w-full" disabled={creating}>
                <User size={14} strokeWidth={1.5} />
                {creating ? 'Creating account…' : 'Create Account & Save Downloads'}
              </button>
            </form>
            <button
              type="button"
              onClick={() => setShowAccountPrompt(false)}
              className="mt-3 font-body text-xs text-ink-faint hover:text-ink transition-colors w-full text-center"
            >
              No thanks, I&apos;ll download now
            </button>
          </motion.div>
        )}

        {accountCreated && !user && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-8 bg-sage/10 border border-sage/30 p-4 flex items-center gap-3"
          >
            <Check size={18} className="text-sage" strokeWidth={2} />
            <p className="font-body text-sm text-ink">
              Account created! Check your email to confirm, then sign in to access your downloads.
            </p>
          </motion.div>
        )}

        {accountCreated && user && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-8 bg-sage/10 border border-sage/30 p-4 flex items-center gap-3"
          >
            <Check size={18} className="text-sage" strokeWidth={2} />
            <p className="font-body text-sm text-ink">
              Account ready! Your purchases are saved in My Account.
            </p>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-10"
        >
          <Link to="/products" className="btn-ghost">
            Continue Shopping
            <ArrowRight size={14} strokeWidth={2} />
          </Link>
        </motion.div>
      </div>
    </main>
  );
}
