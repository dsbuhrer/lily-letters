import { useState } from 'react';
import api from '../../lib/api';

export default function NewsletterBlock({ source = 'blog', variant = 'light' }) {
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg('');
    try {
      await api.subscribe(email, source);
      setMsg('Thank you! Check your inbox for styling tips and offers.');
      setEmail('');
    } catch (err) {
      setMsg(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const dark = variant === 'dark';

  return (
    <section
      className={`mt-12 p-8 md:p-12 text-center overflow-hidden relative ${
        dark
          ? 'bg-wine text-cream shadow-[0_8px_40px_-12px_rgba(76,34,51,0.35)]'
          : 'bg-white shadow-[0_4px_24px_-8px_rgba(76,34,51,0.1)] ring-1 ring-wine/5'
      }`}
    >
      {dark && (
        <>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(151,129,82,0.2),transparent_55%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(107,112,80,0.12),transparent_50%)]" />
        </>
      )}
      <div className="relative z-10">
        <p className={`text-xs font-body font-medium tracking-[0.2em] uppercase mb-2 ${dark ? 'text-gold' : 'text-gold'}`}>
          Newsletter
        </p>
        <h2 className={`font-display text-2xl md:text-3xl font-light mb-2 ${dark ? 'text-cream' : 'text-wine'}`}>
          Get wedding styling tips in your inbox
        </h2>
        <p className={`text-sm mb-6 max-w-md mx-auto leading-relaxed ${dark ? 'text-cream/70' : 'text-[#2d2020]/55'}`}>
          Exclusive offers, new template launches, and inspiration for your celebration.
        </p>
        <form onSubmit={submit} className="flex flex-col sm:flex-row gap-0 max-w-md mx-auto overflow-hidden shadow-sm">
          <input
            type="email"
            required
            placeholder="Your email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={`flex-1 px-5 py-3.5 text-sm font-body border-0 focus:outline-none ${
              dark
                ? 'bg-cream/10 text-cream placeholder-cream/40'
                : 'bg-cream/80 text-[#2d2020] placeholder-[#a89c96]'
            }`}
          />
          <button
            type="submit"
            disabled={loading}
            className="px-7 py-3.5 bg-gold hover:bg-[#7a6a3e] text-cream text-xs font-body font-medium tracking-widest uppercase transition-colors whitespace-nowrap"
          >
            {loading ? '…' : 'Subscribe'}
          </button>
        </form>
        {msg && (
          <p className={`mt-4 text-sm ${dark ? 'text-cream/80' : 'text-sage'}`}>{msg}</p>
        )}
      </div>
    </section>
  );
}
