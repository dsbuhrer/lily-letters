import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  clearAuthCallbackParams,
  getAuthCallbackErrorMessage,
  parseAuthCallbackParams,
} from '../../lib/authCallback';

export default function AccountResetPasswordPage() {
  const { user, loading, configured, updatePassword, resetPassword, supabase } = useAuth();
  const navigate = useNavigate();

  const [callbackError, setCallbackError] = useState(null);
  const [recoveryMode, setRecoveryMode] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const [resendEmail, setResendEmail] = useState('');
  const [resendStatus, setResendStatus] = useState('');
  const [resending, setResending] = useState(false);

  useEffect(() => {
    const params = parseAuthCallbackParams();
    if (params?.error) {
      setCallbackError(getAuthCallbackErrorMessage(params));
      clearAuthCallbackParams();
      return;
    }

    if (!supabase) return undefined;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setRecoveryMode(true);
        setCallbackError(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => {
    if (loading) return;

    const params = parseAuthCallbackParams();
    if (params?.error) return;

    if (user) {
      setRecoveryMode(true);
    }
  }, [loading, user]);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => navigate('/account', { replace: true }), 2000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [success, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (password.length < 8) {
      setFormError('Password must be at least 8 characters');
      return;
    }
    if (password !== confirmPassword) {
      setFormError('Passwords do not match');
      return;
    }

    setSubmitting(true);
    try {
      await updatePassword(password);
      setSuccess(true);
    } catch (err) {
      setFormError(err.message || 'Could not update password');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async (e) => {
    e.preventDefault();
    if (!resendEmail.trim()) {
      setResendStatus('Enter your email address');
      return;
    }
    setResending(true);
    setResendStatus('');
    try {
      await resetPassword(resendEmail.trim());
      setResendStatus('Password reset email sent. Check your inbox.');
    } catch (err) {
      setResendStatus(err.message || 'Could not send reset email');
    } finally {
      setResending(false);
    }
  };

  if (!configured) {
    return (
      <main className="min-h-screen bg-cream pt-24 flex items-center justify-center px-6">
        <p className="font-body text-sm text-ink-muted text-center">
          Customer accounts are not configured yet.
        </p>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-cream pt-24 flex items-center justify-center">
        <p className="font-body text-sm text-ink-subtle">Loading…</p>
      </main>
    );
  }

  if (success) {
    return (
      <main className="min-h-screen bg-cream pt-24 flex items-center justify-center px-6 pb-12">
        <div className="auth-panel auth-panel-centered">
          <p className="section-subtitle mb-2">My Account</p>
          <h1 className="font-display text-3xl text-wine mb-4">Password updated</h1>
          <p className="page-lead mx-auto mb-6">
            Your password has been changed. Redirecting to your account…
          </p>
          <Link to="/account" className="btn-primary w-full inline-block text-center">
            Go to my account
          </Link>
        </div>
      </main>
    );
  }

  if (callbackError) {
    return (
      <main className="min-h-screen bg-cream pt-24 flex items-center justify-center px-6 pb-12">
        <div className="w-full max-w-md">
          <div className="auth-panel auth-panel-centered mb-6">
            <p className="section-subtitle mb-2">My Account</p>
            <h1 className="font-display text-3xl text-wine mb-4">Link expired</h1>
            <p className="form-error text-center mb-6">{callbackError}</p>
          </div>

          <form onSubmit={handleResend} className="auth-panel">
            <p className="page-lead text-center mx-auto mb-6">
              Enter your email to receive a new reset link.
            </p>

            {resendStatus && (
              <p
                className={`text-center mb-4 font-body text-sm ${
                  resendStatus.includes('sent') ? 'form-success' : 'form-error'
                }`}
                role="status"
              >
                {resendStatus}
              </p>
            )}

            <label className="block mb-6">
              <span className="form-label">Email</span>
              <input
                type="email"
                className="input-field"
                value={resendEmail}
                onChange={(e) => setResendEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </label>

            <button type="submit" className="btn-primary w-full" disabled={resending}>
              {resending ? 'Sending…' : 'Send new reset link'}
            </button>
          </form>

          <p className="font-body text-sm text-center text-ink-subtle mt-6">
            <Link to="/account/login" className="text-wine hover:underline">
              Back to sign in
            </Link>
          </p>
        </div>
      </main>
    );
  }

  if (recoveryMode && user) {
    return (
      <main className="min-h-screen bg-cream pt-24 flex items-center justify-center px-6 pb-12">
        <div className="w-full max-w-md">
          <form onSubmit={handleSubmit} className="auth-panel">
            <p className="section-subtitle mb-2 text-center">My Account</p>
            <h1 className="font-display text-3xl text-wine text-center mb-2">Choose a new password</h1>
            <p className="page-lead text-center mx-auto mb-8">
              Enter a new password for {user.email}
            </p>

            {formError && <p className="form-error mb-4">{formError}</p>}

            <label className="block mb-4">
              <span className="form-label">New password</span>
              <input
                type="password"
                className="input-field"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
              />
            </label>
            <label className="block mb-6">
              <span className="form-label">Confirm password</span>
              <input
                type="password"
                className="input-field"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
              />
            </label>

            <button type="submit" className="btn-primary w-full" disabled={submitting}>
              {submitting ? 'Saving…' : 'Update password'}
            </button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-cream pt-24 flex items-center justify-center px-6 pb-12">
      <div className="auth-panel auth-panel-centered">
        <p className="section-subtitle mb-2">My Account</p>
        <h1 className="font-display text-3xl text-wine mb-4">Invalid link</h1>
        <p className="page-lead mx-auto mb-6">
          This password reset link is invalid or has expired.
        </p>
        <Link to="/account/login" className="btn-primary w-full inline-block text-center mb-3">
          Sign in
        </Link>
        <p className="font-body text-sm text-ink-subtle">
          Use &ldquo;Forgot password?&rdquo; on the sign-in page to request a new link.
        </p>
      </div>
    </main>
  );
}
