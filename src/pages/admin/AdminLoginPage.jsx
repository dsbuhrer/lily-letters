import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../../context/AdminAuthContext';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login, configured } = useAdminAuth();

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(email, password);
      navigate('/admin', { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  if (!configured) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center px-6">
        <p className="text-sm text-ink-muted text-center max-w-md">
          Configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env before using the CMS.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-6">
      <form onSubmit={submit} className="auth-panel">
        <p className="section-subtitle mb-2 text-center">CMS</p>
        <h1 className="font-display text-3xl text-wine text-center mb-8">Sign in</h1>
        {error && <p className="form-error mb-4">{error}</p>}
        <label className="block mb-4">
          <span className="form-label">Email</span>
          <input
            type="email"
            className="input-field"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
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
          />
        </label>
        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}
