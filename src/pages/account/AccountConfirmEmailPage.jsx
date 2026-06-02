import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { isEmailConfirmed } from '../../lib/authEmail';

export default function AccountConfirmEmailPage() {
  const { user, signOut, resendConfirmationEmail, configured, loading } = useAuth();
  const [resendStatus, setResendStatus] = useState('');
  const [resending, setResending] = useState(false);

  if (!configured) {
    return (
      <main className="min-h-screen bg-cream pt-24 flex items-center justify-center px-6">
        <p className="font-body text-sm text-[#2d2020]/60 text-center">
          Customer accounts are not configured yet.
        </p>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-cream pt-24 flex items-center justify-center">
        <p className="font-body text-sm text-[#2d2020]/50">Loading…</p>
      </main>
    );
  }

  if (!user) {
    return <Navigate to="/account/login" replace />;
  }

  if (isEmailConfirmed(user)) {
    return <Navigate to="/account" replace />;
  }

  const handleResend = async () => {
    setResending(true);
    setResendStatus('');
    try {
      await resendConfirmationEmail(user.email);
      setResendStatus('We sent a new confirmation link. Check your inbox.');
    } catch (err) {
      setResendStatus(err.message || 'Could not resend email. Try again in a few minutes.');
    } finally {
      setResending(false);
    }
  };

  return (
    <main className="min-h-screen bg-cream pt-24 flex items-center justify-center px-6 pb-12">
      <div className="w-full max-w-md bg-white/80 border border-taupe p-8 text-center">
        <p className="section-subtitle mb-2">My Account</p>
        <h1 className="font-display text-3xl text-wine mb-4">Confirm your email</h1>
        <p className="font-body text-sm text-[#2d2020]/60 mb-2">
          We sent a confirmation link to:
        </p>
        <p className="font-body text-sm text-wine font-medium mb-6">{user.email}</p>
        <p className="font-body text-sm text-[#2d2020]/50 mb-6">
          Your purchases will be linked to this account only after you confirm your email address.
        </p>

        {resendStatus && (
          <p className="font-body text-sm text-sage mb-4" role="status">
            {resendStatus}
          </p>
        )}

        <button
          type="button"
          className="btn-primary w-full mb-3"
          onClick={handleResend}
          disabled={resending}
        >
          {resending ? 'Sending…' : 'Resend confirmation email'}
        </button>

        <button type="button" className="btn-ghost w-full text-sm" onClick={() => signOut()}>
          Sign out
        </button>

        <p className="font-body text-sm text-[#2d2020]/50 mt-6">
          Wrong address?{' '}
          <Link to="/account/register" className="text-wine hover:underline" onClick={() => signOut()}>
            Use a different email
          </Link>
        </p>
      </div>
    </main>
  );
}
