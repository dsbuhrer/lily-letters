import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Instagram, Mail, Heart } from 'lucide-react';
import api from '../lib/api';

const footerLinks = {
  Shop: [
    { label: 'All Templates', to: '/products' },
    { label: 'Invitation Suites', to: '/products?category=suites' },
    { label: 'Save the Date', to: '/products?category=save-the-date' },
    { label: 'Wedding Signs', to: '/products?category=signs' },
    { label: 'Bundle Sets', to: '/products?category=bundles' },
  ],
  Info: [
    { label: 'Blog', to: '/blog' },
    { label: 'About Us', to: '/about' },
    { label: 'FAQ', to: '/faq' },
    { label: 'Contact', to: '/contact' },
  ],
  Help: [
    { label: 'How it Works', to: '/faq#how-it-works' },
    { label: 'Printing Tips', to: '/faq#printing' },
    { label: 'Canva Tutorial', to: '/faq#canva' },
    { label: 'Refund Policy', to: '/faq#refund' },
  ],
};

export default function Footer() {
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('');

  const onSubscribe = async (e) => {
    e.preventDefault();
    try {
      await api.subscribe(email, 'footer');
      setMsg('Subscribed! Thank you.');
      setEmail('');
    } catch (err) {
      setMsg(err.message || 'Could not subscribe.');
    }
  };

  return (
    <footer className="bg-wine text-cream">
      {/* Top section */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-16 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand */}
          <div className="lg:col-span-2">
            <img
              src="/logos/logo-primary.svg"
              alt="The Lily Letters Co"
              className="h-36 w-auto mb-4 invert brightness-0 saturate-0 opacity-90"
            />
            <p className="font-body text-sm text-cream/75 leading-relaxed max-w-xs">
              Beautifully crafted wedding stationery & printable templates. 
              Editable in Canva — personalize, download, and print instantly.
            </p>
            <div className="flex items-center gap-4 mt-6">
              <a
                href="https://www.instagram.com/thelilyletters.co"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-cream/60 hover:text-cream transition-colors focus-visible:outline-offset-2 focus-visible:outline-cream/50"
                aria-label="Instagram"
              >
                <Instagram size={20} strokeWidth={1.5} />
              </a>
              <a
                href="mailto:thelilyletters.co@gmail.com"
                className="p-2 text-cream/60 hover:text-cream transition-colors focus-visible:outline-offset-2 focus-visible:outline-cream/50"
                aria-label="Email"
              >
                <Mail size={20} strokeWidth={1.5} />
              </a>
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([heading, links]) => (
            <div key={heading}>
              <h3 className="font-body text-xs tracking-[0.2em] uppercase text-cream/50 mb-4 font-medium">
                {heading}
              </h3>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.to}
                      className="font-body text-sm text-cream/75 hover:text-cream transition-colors focus-visible:outline-offset-2 focus-visible:outline-cream/40"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Newsletter */}
        <div className="mt-12 pt-8 border-t border-cream/10">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="flex-1">
              <h3 className="font-display text-xl font-light mb-1">
                Get 10% off your first order
              </h3>
              <p className="font-body text-sm text-cream/60">
                Subscribe for exclusive offers, styling tips, and new template launches.
              </p>
            </div>
            <form className="flex flex-col gap-2 w-full md:w-auto" onSubmit={onSubscribe}>
              <div className="flex flex-col sm:flex-row gap-0 sm:gap-0 w-full md:w-auto">
                <input
                  type="email"
                  required
                  placeholder="Your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 md:w-64 px-4 py-3 bg-cream/10 border border-cream/25 text-cream placeholder-cream/45 text-sm font-body focus:outline-none focus:border-cream/60 focus:ring-2 focus:ring-cream/15 transition-all"
                />
                <button
                  type="submit"
                  className="px-6 py-3 bg-gold hover:bg-[#7a6a3e] active:scale-[0.98] text-cream text-xs font-body font-medium tracking-widest uppercase transition-all whitespace-nowrap focus-visible:outline-offset-2 focus-visible:outline-cream/50"
                >
                  Subscribe
                </button>
              </div>
              {msg && <p className="text-xs text-cream/75" role="status">{msg}</p>}
            </form>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-8 pt-6 border-t border-cream/10 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="font-body text-xs text-cream/40">
            © {new Date().getFullYear()} The Lily Letters Co. All rights reserved.
          </p>
          <p className="font-body text-xs text-cream/40 flex items-center gap-1">
            Made with <Heart size={12} className="text-taupe" fill="currentColor" /> for couples in love
          </p>
        </div>
      </div>
    </footer>
  );
}
