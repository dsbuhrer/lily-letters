import { useState } from 'react';
import { User, LogIn } from 'lucide-react';

const MODES = [
  { id: 'signup', label: 'Create account' },
  { id: 'signin', label: 'Sign in' },
];

export default function OrderAccessPanel({
  orderNumber,
  configured,
  loading,
  error,
  onGuestAccess,
  onSignUp,
  onSignIn,
}) {
  const [mode, setMode] = useState('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const normalizedEmail = email.trim();
    if (!normalizedEmail) return;

    if (mode === 'signup') {
      await onSignUp(normalizedEmail, password);
    } else {
      await onSignIn(normalizedEmail, password);
    }
  };

  const handleGuest = async (e) => {
    e.preventDefault();
    const normalizedEmail = email.trim();
    if (!normalizedEmail) return;
    await onGuestAccess(normalizedEmail);
  };

  return (
    <main className="min-h-screen bg-cream pt-20">
      <div className="max-w-md mx-auto px-6 py-16">
        <div className="panel shadow-soft p-8">
          <p className="section-subtitle mb-2 text-center">Order Confirmation</p>
          <h1 className="font-display text-3xl text-wine text-center mb-2">Access Your Order</h1>
          <p className="font-body text-sm text-ink-muted text-center mb-1">
            Order <span className="font-medium text-wine">{orderNumber}</span>
          </p>
          <p className="font-body text-sm text-ink-subtle text-center mb-8">
            Enter the email used at checkout to view your purchase and downloads.
          </p>

          {error && <p className="form-error mb-4 text-center">{error}</p>}

          {configured && (
            <div className="flex gap-1 p-1 bg-cream border border-taupe/40 mb-6">
              {MODES.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setMode(item.id)}
                  className={
                    mode === item.id
                      ? 'flex-1 py-2 px-3 font-body text-xs font-medium bg-wine text-cream transition-colors'
                      : 'flex-1 py-2 px-3 font-body text-xs font-medium text-ink-muted hover:text-wine transition-colors'
                  }
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block">
              <span className="form-label">Email</span>
              <input
                type="email"
                className="input-field"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="you@example.com"
              />
            </label>

            {configured && (
              <label className="block">
                <span className="form-label">Password</span>
                <input
                  type="password"
                  className="input-field"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  placeholder={mode === 'signup' ? 'Create a password (8+ characters)' : 'Your password'}
                />
              </label>
            )}

            {configured ? (
              <button type="submit" className="btn-primary w-full justify-center" disabled={loading}>
                {mode === 'signup' ? (
                  <>
                    <User size={14} strokeWidth={1.5} />
                    {loading ? 'Creating account…' : 'Create Account & View Order'}
                  </>
                ) : (
                  <>
                    <LogIn size={14} strokeWidth={1.5} />
                    {loading ? 'Signing in…' : 'Sign In & View Order'}
                  </>
                )}
              </button>
            ) : (
              <button type="button" onClick={handleGuest} className="btn-primary w-full" disabled={loading}>
                {loading ? 'Loading…' : 'View Order'}
              </button>
            )}
          </form>

          {configured && (
            <button
              type="button"
              onClick={handleGuest}
              disabled={loading || !email.trim()}
              className="mt-4 font-body text-xs text-ink-faint hover:text-wine transition-colors w-full text-center disabled:opacity-50"
            >
              Just view my order without creating an account
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
