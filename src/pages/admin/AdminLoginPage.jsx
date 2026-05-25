import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.login(email, password);
      navigate('/admin');
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-6">
      <form onSubmit={submit} className="w-full max-w-md bg-white/80 border border-taupe p-8 shadow-sm">
        <p className="section-subtitle mb-2 text-center">CMS</p>
        <h1 className="font-display text-3xl text-wine text-center mb-8">Sign in</h1>
        {error && <p className="text-red-600 text-sm mb-4 text-center">{error}</p>}
        <label className="block mb-4">
          <span className="text-xs uppercase tracking-widest text-[#2d2020]/50">Email</span>
          <input
            type="email"
            className="input-field mt-1"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label className="block mb-6">
          <span className="text-xs uppercase tracking-widest text-[#2d2020]/50">Password</span>
          <input
            type="password"
            className="input-field mt-1"
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
