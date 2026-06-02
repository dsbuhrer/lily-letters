import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function AccountRegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState(false);
  const [resendStatus, setResendStatus] = useState('');
  const [resending, setResending] = useState(false);
  const { signUp, resendConfirmationEmail, configured, user, emailConfirmed } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && emailConfirmed) navigate('/account', { replace: true });
    if (user && !emailConfirmed) navigate('/account/confirm-email', { replace: true });
  }, [user, emailConfirmed, navigate]);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { session, user: newUser } = await signUp(email, password, { firstName, lastName });
      if (session && newUser?.email_confirmed_at) {
        navigate('/account', { replace: true });
      } else {
        setConfirmEmail(true);
      }
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
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

  if (confirmEmail) {
    const handleResend = async () => {
      setResending(true);
      setResendStatus('');
      try {
        await resendConfirmationEmail(email);
        setResendStatus('We sent a new confirmation link.');
      } catch (err) {
        setResendStatus(err.message || 'Could not resend. Try again shortly.');
      } finally {
        setResending(false);
      }
    };

    return (
      <main className="min-h-screen bg-cream pt-24 flex items-center justify-center px-6 pb-12">
        <div className="auth-panel auth-panel-centered">
          <h1 className="font-display text-3xl text-wine mb-4">Check your email</h1>
          <p className="page-lead mx-auto mb-6">
            We sent a confirmation link to <strong>{email}</strong>. Click it to activate your
            account and access your purchases.
          </p>
          {resendStatus && (
            <p className="font-body text-sm text-sage mb-4" role="status">
              {resendStatus}
            </p>
          )}
          <button
            type="button"
            className="btn-primary w-full"
            onClick={handleResend}
            disabled={resending}
          >
            {resending ? 'Sending…' : 'Resend confirmation email'}
          </button>
          <Link to="/account/login" className="btn-ghost inline-flex mt-3 text-sm">
            Back to sign in
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-cream pt-24 flex items-center justify-center px-6 pb-12">
      <div className="w-full max-w-md">
        <form onSubmit={submit} className="auth-panel">
          <p className="section-subtitle mb-2 text-center">My Account</p>
          <h1 className="font-display text-3xl text-wine text-center mb-2">Create account</h1>
          <p className="page-lead text-center mx-auto mb-8">
            Save your downloads and track orders
          </p>

          {error && <p className="form-error mb-4">{error}</p>}

          <div className="grid grid-cols-2 gap-3 mb-4">
            <label className="block">
              <span className="form-label">First name</span>
              <input
                type="text"
                className="input-field"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </label>
            <label className="block">
              <span className="form-label">Last name</span>
              <input
                type="text"
                className="input-field"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </label>
          </div>

          <label className="block mb-4">
            <span className="form-label">Email</span>
            <input
              type="email"
              className="input-field"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </label>
          <label className="block mb-6">
            <span className="form-label">Password</span>
            <input
              type="password"
              className="input-field"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
            />
            <p className="form-hint">At least 8 characters</p>
          </label>

          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="font-body text-sm text-center text-ink-subtle mt-6">
          Already have an account?{' '}
          <Link to="/account/login" className="text-wine hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
