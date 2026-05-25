import { Routes, Route, useLocation } from 'react-router-dom';
import { useEffect, lazy, Suspense } from 'react';
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
import AdminLayout from './components/admin/AdminLayout';
import AdminGuard from './components/admin/AdminGuard';
import AdminLoginPage from './pages/admin/AdminLoginPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminPostsPage from './pages/admin/AdminPostsPage';
import AdminPostEditorPage from './pages/admin/AdminPostEditorPage';
import AdminProductsPage from './pages/admin/AdminProductsPage';
import AdminSubscribersPage from './pages/admin/AdminSubscribersPage';

const BlogIndexPage = lazy(() => import('./pages/blog/BlogIndexPage'));
const BlogPostPage = lazy(() => import('./pages/blog/BlogPostPage'));
const BlogCategoryPage = lazy(() => import('./pages/blog/BlogCategoryPage'));
const BlogSearchPage = lazy(() => import('./pages/blog/BlogSearchPage'));
const BlogTagPage = lazy(() => import('./pages/blog/BlogTagPage'));

const HIDE_LAYOUT = ['/checkout', '/order-confirmation', '/admin'];

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function PageFallback() {
  return (
    <main className="min-h-screen bg-cream pt-28 flex items-center justify-center">
      <p className="font-body text-sm text-[#2d2020]/50">Loading…</p>
    </main>
  );
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

          <Route
            path="/blog"
            element={
              <Suspense fallback={<PageFallback />}>
                <BlogIndexPage />
              </Suspense>
            }
          />
          <Route
            path="/blog/search"
            element={
              <Suspense fallback={<PageFallback />}>
                <BlogSearchPage />
              </Suspense>
            }
          />
          <Route
            path="/blog/category/:slug"
            element={
              <Suspense fallback={<PageFallback />}>
                <BlogCategoryPage />
              </Suspense>
            }
          />
          <Route
            path="/blog/tag/:slug"
            element={
              <Suspense fallback={<PageFallback />}>
                <BlogTagPage />
              </Suspense>
            }
          />
          <Route
            path="/blog/:slug"
            element={
              <Suspense fallback={<PageFallback />}>
                <BlogPostPage />
              </Suspense>
            }
          />

          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route element={<AdminGuard />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin" element={<AdminDashboardPage />} />
              <Route path="/admin/posts" element={<AdminPostsPage />} />
              <Route path="/admin/posts/:id" element={<AdminPostEditorPage />} />
              <Route path="/admin/products" element={<AdminProductsPage />} />
              <Route path="/admin/subscribers" element={<AdminSubscribersPage />} />
            </Route>
          </Route>

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
