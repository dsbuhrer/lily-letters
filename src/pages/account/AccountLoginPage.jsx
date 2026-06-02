import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function AccountLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const { signIn, resetPassword, configured, user, emailConfirmed } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/account';

  useEffect(() => {
    if (user && emailConfirmed) navigate(from, { replace: true });
    if (user && !emailConfirmed) navigate('/account/confirm-email', { replace: true });
  }, [user, emailConfirmed, from, navigate]);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { user: signedInUser } = await signIn(email, password);
      if (signedInUser && !signedInUser.email_confirmed_at) {
        navigate('/account/confirm-email', { replace: true });
      } else {
        navigate(from, { replace: true });
      }
    } catch (err) {
      setError(err.message || 'Sign in failed');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!email) {
      setError('Enter your email address first');
      return;
    }
    setError('');
    try {
      await resetPassword(email);
      setResetSent(true);
    } catch (err) {
      setError(err.message || 'Could not send reset email');
    }
  };

  if (!configured) {
    return (
      <main className="min-h-screen bg-cream pt-24 flex items-center justify-center px-6">
        <p className="font-body text-sm text-[#2d2020]/60 text-center">
          Customer accounts are not configured yet.
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-cream pt-24 flex items-center justify-center px-6 pb-12">
      <div className="w-full max-w-md">
        <form onSubmit={submit} className="bg-white/80 border border-taupe p-8 shadow-sm">
          <p className="section-subtitle mb-2 text-center">My Account</p>
          <h1 className="font-display text-3xl text-wine text-center mb-2">Sign in</h1>
          <p className="font-body text-sm text-[#2d2020]/50 text-center mb-8">
            Access your purchases and downloads
          </p>

          {error && <p className="text-red-600 text-sm mb-4 text-center">{error}</p>}
          {resetSent && (
            <p className="text-sage text-sm mb-4 text-center">
              Password reset email sent. Check your inbox.
            </p>
          )}

          <label className="block mb-4">
            <span className="text-xs uppercase tracking-widest text-[#2d2020]/50">Email</span>
            <input
              type="email"
              className="input-field mt-1"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </label>
          <label className="block mb-4">
            <span className="text-xs uppercase tracking-widest text-[#2d2020]/50">Password</span>
            <input
              type="password"
              className="input-field mt-1"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </label>

          <button type="button" onClick={handleReset} className="btn-ghost text-xs mb-6 w-full">
            Forgot password?
          </button>

          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="font-body text-sm text-center text-[#2d2020]/50 mt-6">
          Don&apos;t have an account?{' '}
          <Link to="/account/register" className="text-wine hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </main>
  );
}
