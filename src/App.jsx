import { Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';

import Header from './components/Header';
import Footer from './components/Footer';
import CartDrawer from './components/CartDrawer';
import HomePage from './pages/HomePage';
import ProductsPage from './pages/ProductsPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderConfirmationPage from './pages/OrderConfirmationPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import FAQPage from './pages/FAQPage';
import WishlistPage from './pages/WishlistPage';

const HIDE_LAYOUT = ['/checkout', '/order-confirmation'];

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  const location = useLocation();
  const hideLayout = HIDE_LAYOUT.some((p) => location.pathname.startsWith(p));

  return (
    <>
      <ScrollToTop />
      {!hideLayout && <Header />}
      {!hideLayout && <CartDrawer />}

      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<HomePage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/products/:id" element={<ProductDetailPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/order-confirmation" element={<OrderConfirmationPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/faq" element={<FAQPage />} />
          <Route path="/wishlist" element={<WishlistPage />} />
          {/* 404 */}
          <Route
            path="*"
            element={
              <main className="min-h-screen bg-cream flex items-center justify-center text-center px-6">
                <div>
                  <p className="font-display text-8xl font-light text-wine/20 mb-4">404</p>
                  <h1 className="font-display text-3xl font-light text-wine mb-4">Page Not Found</h1>
                  <p className="font-body text-sm text-[#2d2020]/50 mb-6">
                    The page you're looking for doesn't exist.
                  </p>
                  <a href="/" className="btn-primary">
                    Go Home
                  </a>
                </div>
              </main>
            }
          />
        </Routes>
      </AnimatePresence>

      {!hideLayout && <Footer />}
    </>
  );
}
