import { useEffect, useState } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Download, Mail, Check, ExternalLink, User, ArrowRight } from 'lucide-react';
import { useUiFeedback } from '../context/UiFeedbackContext';
import { useAuth } from '../context/AuthContext';
import { isEmailConfirmed } from '../lib/authEmail';
import {
  downloadOrderPdfs,
  downloadOrderLinksPdf,
  orderHasPdfDownload,
  orderHasLegacyCanvaDownload,
} from '../lib/orderDownloads';

export default function OrderConfirmationPage() {
  const { toast } = useUiFeedback();
  const { signUp, configured, user } = useAuth();
  const navigate = useNavigate();
  const { state } = useLocation();
  const [showAccountPrompt, setShowAccountPrompt] = useState(false);
  const [accountCreated, setAccountCreated] = useState(false);
  const [password, setPassword] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (user && isEmailConfirmed(user)) {
      setAccountCreated(true);
      return undefined;
    }
    const timer = setTimeout(() => setShowAccountPrompt(true), 1500);
    return () => clearTimeout(timer);
  }, [user]);

  const order = state || {
    email: 'guest@example.com',
    firstName: 'Guest',
    items: [],
    total: 0,
    orderId: 'TLLC-DEMO',
  };

  const handleCreateAccount = async (e) => {
    e.preventDefault();
    if (!configured) {
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

  const buildOrderForDownload = () => {
    const orderItems =
      order.orderItems ||
      (order.items || []).map((item) => ({
        product_name: item.name,
        pdf_url: item.pdfUrl || item.pdf_url || null,
        pdf_signed_url: item.pdf_signed_url || null,
        canva_link: item.canvaLink || item.canva_link || null,
      }));

    return {
      order_number: order.orderId,
      paid_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      order_items: orderItems,
    };
  };

  const handleDownload = async () => {
    const mockOrder = buildOrderForDownload();
    const hasPdf = orderHasPdfDownload(mockOrder);
    const hasLegacy = orderHasLegacyCanvaDownload(mockOrder);

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
        await downloadOrderPdfs(mockOrder);
      } else {
        downloadOrderLinksPdf(mockOrder);
      }
    } catch (err) {
      toast.error(err.message || 'Download failed.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <main className="min-h-screen bg-cream pt-20">
      <div className="max-w-3xl mx-auto px-6 py-16 text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', damping: 15, stiffness: 200 }}
          className="w-20 h-20 bg-sage rounded-full flex items-center justify-center mx-auto mb-8"
        >
          <motion.div initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}>
            <Check size={36} strokeWidth={2} className="text-cream" />
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <p className="section-subtitle mb-3">Order Confirmed</p>
          <h1 className="font-display text-4xl md:text-5xl font-light text-wine mb-3">
            Thank You, {order.firstName}!
          </h1>
          <p className="font-body text-sm text-ink-muted mb-2">
            Order <span className="font-medium text-wine">{order.orderId}</span>
          </p>
          <p className="font-body text-sm text-ink-subtle">
            A confirmation and your download link have been sent to{' '}
            <span className="text-wine font-medium">{order.email}</span>
          </p>
        </motion.div>

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
            Click below to download your PDF file(s). Save them to your device for easy access
            anytime during your 1-year download period.
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
              Also sent to your email
            </span>
            <span>·</span>
            <span>Available for 1 year</span>
          </div>
        </motion.div>

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
              'Keep your download safe — access is available for 1 year',
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

        {showAccountPrompt && !accountCreated && configured && (
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
              Create a free account to access your downloads anytime, track your orders,
              and get exclusive member discounts.
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
