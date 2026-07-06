import { useState, useEffect } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Menu, X, Heart, User } from 'lucide-react';
import useCartStore from '../store/cartStore';
import useWishlistStore from '../store/wishlistStore';
import { useAuth } from '../context/AuthContext';

const navLinks = [
  { to: '/products', label: 'Shop' },
  { to: '/blog', label: 'Blog' },
  { to: '/about', label: 'About' },
  { to: '/faq', label: 'FAQ' },
  { to: '/contact', label: 'Contact' },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { items, openCart, closeCart, isOpen: cartOpen } = useCartStore();
  const { items: wishlistItems } = useWishlistStore();
  const { user } = useAuth();
  const location = useLocation();

  const totalItems = items.length;
  const wishlistCount = wishlistItems.length;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  const handleOpenCart = () => {
    setMobileOpen(false);
    openCart();
  };

  const headerBg = scrolled
    ? 'bg-cream/95 backdrop-blur-md shadow-soft border-b border-taupe/25'
    : 'bg-cream border-b border-taupe/30';

  return (
    <>
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-400 ${headerBg}`}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <Link to="/" className="flex items-center gap-3 group shrink-0">
              <motion.img
                src="/logos/logo-horizontal.svg"
                alt="The Lily Letters Co"
                className="h-14 w-auto"
                whileHover={{ scale: 1.02 }}
                transition={{ type: 'spring', stiffness: 400 }}
              />
            </Link>

            <nav className="hidden md:flex items-center gap-8" aria-label="Main">
              {navLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    `nav-link ${isActive ? 'nav-link-active' : ''}`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>

            <div className="flex items-center gap-1 sm:gap-2">
              <NavLink
                to={user ? '/account' : '/account/login'}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `hidden sm:inline-flex items-center gap-1.5 px-2 py-1.5 font-body text-xs tracking-widest uppercase transition-colors focus-visible:outline-offset-2 ${
                    isActive ? 'text-wine' : 'text-ink hover:text-wine'
                  }`
                }
                aria-label={user ? 'My account' : 'Sign in'}
              >
                <User size={18} strokeWidth={1.5} />
                {user ? 'Account' : 'Sign in'}
              </NavLink>
              <NavLink
                to="/wishlist"
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `icon-btn relative ${isActive ? 'text-wine' : ''}`
                }
                aria-label="View wishlist"
              >
                <Heart size={22} strokeWidth={1.5} />
                {wishlistCount > 0 && (
                  <motion.span
                    key={wishlistCount}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-0.5 -right-0.5 bg-gold text-cream text-[10px] min-w-[1.25rem] h-5 px-1 rounded-full flex items-center justify-center font-body font-medium shadow-soft"
                  >
                    {wishlistCount}
                  </motion.span>
                )}
              </NavLink>
              <button
                type="button"
                onClick={handleOpenCart}
                className="icon-btn relative"
                aria-label="Open cart"
                aria-expanded={cartOpen}
              >
                <ShoppingBag size={22} strokeWidth={1.5} />
                {totalItems > 0 && (
                  <motion.span
                    key={totalItems}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-0.5 -right-0.5 bg-wine text-cream text-[10px] min-w-[1.25rem] h-5 px-1 rounded-full flex items-center justify-center font-body font-medium shadow-soft"
                  >
                    {totalItems}
                  </motion.span>
                )}
              </button>

              <button
                type="button"
                className="icon-btn md:hidden"
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={mobileOpen}
              >
                {mobileOpen ? <X size={22} strokeWidth={1.5} /> : <Menu size={22} strokeWidth={1.5} />}
              </button>
            </div>
          </div>
        </div>
      </motion.header>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-cream pt-20"
          >
            <nav
              className="flex flex-col items-center justify-center min-h-[calc(100vh-5rem)] gap-8 px-6"
              aria-label="Mobile"
            >
              {navLinks.map((link, i) => (
                <motion.div
                  key={link.to}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                >
                  <NavLink
                    to={link.to}
                    className={({ isActive }) =>
                      `font-display text-3xl font-light transition-colors focus-visible:outline-offset-4 ${
                        isActive ? 'text-wine' : 'text-ink hover:text-wine'
                      }`
                    }
                  >
                    {link.label}
                  </NavLink>
                </motion.div>
              ))}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: navLinks.length * 0.06 }}
              >
                <NavLink
                  to={user ? '/account' : '/account/login'}
                  className="font-display text-3xl font-light text-ink hover:text-wine transition-colors"
                >
                  {user ? 'My Account' : 'Sign In'}
                </NavLink>
              </motion.div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
