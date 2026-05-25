import { useState, useEffect } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Menu, X, Heart } from 'lucide-react';
import useCartStore from '../store/cartStore';
import useWishlistStore from '../store/wishlistStore';

const navLinks = [
  { to: '/products', label: 'Shop' },
  { to: '/about', label: 'About' },
  { to: '/faq', label: 'FAQ' },
  { to: '/contact', label: 'Contact' },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { items, openCart, closeCart, isOpen: cartOpen } = useCartStore();
  const { items: wishlistItems } = useWishlistStore();
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

  const handleOpenCart = () => {
    setMobileOpen(false);
    openCart();
  };

  const headerBg = scrolled
    ? 'bg-cream/95 backdrop-blur-md shadow-sm'
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
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group">
              <motion.img
                src="/logos/logo-horizontal.svg"
                alt="The Lily Letters Co"
                className="h-14 w-auto"
                whileHover={{ scale: 1.02 }}
                transition={{ type: 'spring', stiffness: 400 }}
              />
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    `font-body text-sm tracking-widest uppercase transition-colors duration-200 pb-0.5 ${
                      isActive
                        ? 'text-wine border-b border-wine'
                        : 'text-[#2d2020] hover:text-wine'
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-2 sm:gap-4">
              <NavLink
                to="/wishlist"
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `relative p-2 transition-colors ${
                    isActive ? 'text-wine' : 'text-[#2d2020] hover:text-wine'
                  }`
                }
                aria-label="View wishlist"
              >
                <Heart size={22} strokeWidth={1.5} />
                {wishlistCount > 0 && (
                  <motion.span
                    key={wishlistCount}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 bg-gold text-cream text-xs w-5 h-5 rounded-full flex items-center justify-center font-body font-medium"
                  >
                    {wishlistCount}
                  </motion.span>
                )}
              </NavLink>
              <button
                type="button"
                onClick={handleOpenCart}
                className="relative p-2 text-[#2d2020] hover:text-wine transition-colors"
                aria-label="Open cart"
                aria-expanded={cartOpen}
              >
                <ShoppingBag size={22} strokeWidth={1.5} />
                {totalItems > 0 && (
                  <motion.span
                    key={totalItems}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 bg-wine text-cream text-xs w-5 h-5 rounded-full flex items-center justify-center font-body font-medium"
                  >
                    {totalItems}
                  </motion.span>
                )}
              </button>

              {/* Mobile menu toggle */}
              <button
                className="md:hidden p-2 text-[#2d2020] hover:text-wine transition-colors"
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label="Toggle menu"
              >
                {mobileOpen ? <X size={22} strokeWidth={1.5} /> : <Menu size={22} strokeWidth={1.5} />}
              </button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Mobile Nav */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-cream pt-20"
          >
            <div className="flex flex-col items-center justify-center h-full gap-8">
              {navLinks.map((link, i) => (
                <motion.div
                  key={link.to}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                >
                  <NavLink
                    to={link.to}
                    className={({ isActive }) =>
                      `font-display text-3xl font-light transition-colors ${
                        isActive ? 'text-wine' : 'text-[#2d2020] hover:text-wine'
                      }`
                    }
                  >
                    {link.label}
                  </NavLink>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
