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
    <section className={`mt-12 p-8 md:p-10 text-center ${dark ? 'bg-wine text-cream' : 'bg-white/80 border border-taupe'}`}>
      <h2 className={`font-display text-2xl md:text-3xl font-light mb-2 ${dark ? 'text-cream' : 'text-wine'}`}>
        Get wedding styling tips in your inbox
      </h2>
      <p className={`text-sm mb-6 max-w-md mx-auto ${dark ? 'text-cream/70' : 'text-[#2d2020]/60'}`}>
        Exclusive offers, new template launches, and inspiration for your celebration.
      </p>
      <form onSubmit={submit} className="flex flex-col sm:flex-row gap-0 max-w-md mx-auto">
        <input
          type="email"
          required
          placeholder="Your email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={`flex-1 px-4 py-3 text-sm font-body border focus:outline-none ${
            dark ? 'bg-cream/10 border-cream/20 text-cream placeholder-cream/40' : 'input-field'
          }`}
        />
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-3 bg-gold hover:bg-[#7a6a3e] text-cream text-xs font-body font-medium tracking-widest uppercase transition-colors whitespace-nowrap"
        >
          {loading ? '…' : 'Subscribe'}
        </button>
      </form>
      {msg && <p className={`mt-3 text-sm ${dark ? 'text-cream/80' : 'text-sage'}`}>{msg}</p>}
    </section>
  );
}
