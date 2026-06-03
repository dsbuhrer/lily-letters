import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { useEffect, lazy, Suspense } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';

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
import AccountLayout from './components/account/AccountLayout';
import AccountGuard from './components/account/AccountGuard';
import AccountLoginPage from './pages/account/AccountLoginPage';
import AccountRegisterPage from './pages/account/AccountRegisterPage';
import AccountDashboardPage from './pages/account/AccountDashboardPage';
import AccountOrdersPage from './pages/account/AccountOrdersPage';
import AccountOrderDetailPage from './pages/account/AccountOrderDetailPage';
import AccountSettingsPage from './pages/account/AccountSettingsPage';
import AccountConfirmEmailPage from './pages/account/AccountConfirmEmailPage';

const BlogIndexPage = lazy(() => import('./pages/blog/BlogIndexPage'));
const BlogPostPage = lazy(() => import('./pages/blog/BlogPostPage'));
const BlogCategoryPage = lazy(() => import('./pages/blog/BlogCategoryPage'));
const BlogSearchPage = lazy(() => import('./pages/blog/BlogSearchPage'));
const BlogTagPage = lazy(() => import('./pages/blog/BlogTagPage'));

const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage'));
const AdminPostsPage = lazy(() => import('./pages/admin/AdminPostsPage'));
const AdminPostEditorPage = lazy(() => import('./pages/admin/AdminPostEditorPage'));
const AdminCategoriesPage = lazy(() => import('./pages/admin/AdminCategoriesPage'));
const AdminCategoryEditorPage = lazy(() => import('./pages/admin/AdminCategoryEditorPage'));
const AdminProductsPage = lazy(() => import('./pages/admin/AdminProductsPage'));
const AdminProductEditorPage = lazy(() => import('./pages/admin/AdminProductEditorPage'));
const AdminProductCategoriesPage = lazy(() => import('./pages/admin/AdminProductCategoriesPage'));
const AdminProductCategoryEditorPage = lazy(() => import('./pages/admin/AdminProductCategoryEditorPage'));
const AdminContactsPage = lazy(() => import('./pages/admin/AdminContactsPage'));
const AdminSubscribersPage = lazy(() => import('./pages/admin/AdminSubscribersPage'));

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
    <main className="min-h-screen bg-cream pt-28 flex flex-col items-center justify-center gap-4 blog-loader-enter">
      <Loader2 size={32} strokeWidth={1.5} className="text-wine blog-loader-spin" aria-hidden />
      <p className="font-body text-xs tracking-[0.2em] uppercase text-ink-subtle">Loading…</p>
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

      <AnimatePresence mode="wait" initial={false}>
        <Routes location={location}>
          <Route path="/" element={<HomePage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/products/:id" element={<ProductDetailPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/order-confirmation" element={<OrderConfirmationPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/faq" element={<FAQPage />} />
          <Route path="/wishlist" element={<WishlistPage />} />

          <Route path="/account/login" element={<AccountLoginPage />} />
          <Route path="/account/register" element={<AccountRegisterPage />} />
          <Route path="/account/confirm-email" element={<AccountConfirmEmailPage />} />
          <Route element={<AccountGuard />}>
            <Route element={<AccountLayout />}>
              <Route path="/account" element={<AccountDashboardPage />} />
              <Route path="/account/orders" element={<AccountOrdersPage />} />
              <Route path="/account/orders/:orderNumber" element={<AccountOrderDetailPage />} />
              <Route path="/account/settings" element={<AccountSettingsPage />} />
            </Route>
          </Route>

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
              <Route
                path="/admin"
                element={
                  <Suspense fallback={<PageFallback />}>
                    <AdminDashboardPage />
                  </Suspense>
                }
              />
              <Route
                path="/admin/posts"
                element={
                  <Suspense fallback={<PageFallback />}>
                    <AdminPostsPage />
                  </Suspense>
                }
              />
              <Route
                path="/admin/posts/:id"
                element={
                  <Suspense fallback={<PageFallback />}>
                    <AdminPostEditorPage />
                  </Suspense>
                }
              />
              <Route
                path="/admin/categories"
                element={
                  <Suspense fallback={<PageFallback />}>
                    <AdminCategoriesPage />
                  </Suspense>
                }
              />
              <Route
                path="/admin/categories/:id"
                element={
                  <Suspense fallback={<PageFallback />}>
                    <AdminCategoryEditorPage />
                  </Suspense>
                }
              />
              <Route
                path="/admin/products"
                element={
                  <Suspense fallback={<PageFallback />}>
                    <AdminProductsPage />
                  </Suspense>
                }
              />
              <Route
                path="/admin/products/:id"
                element={
                  <Suspense fallback={<PageFallback />}>
                    <AdminProductEditorPage />
                  </Suspense>
                }
              />
              <Route
                path="/admin/product-categories"
                element={
                  <Suspense fallback={<PageFallback />}>
                    <AdminProductCategoriesPage />
                  </Suspense>
                }
              />
              <Route
                path="/admin/product-categories/:id"
                element={
                  <Suspense fallback={<PageFallback />}>
                    <AdminProductCategoryEditorPage />
                  </Suspense>
                }
              />
              <Route
                path="/admin/contacts"
                element={
                  <Suspense fallback={<PageFallback />}>
                    <AdminContactsPage />
                  </Suspense>
                }
              />
              <Route path="/admin/leads" element={<Navigate to="/admin/contacts" replace />} />
              <Route
                path="/admin/subscribers"
                element={
                  <Suspense fallback={<PageFallback />}>
                    <AdminSubscribersPage />
                  </Suspense>
                }
              />
            </Route>
          </Route>

          <Route
            path="*"
            element={
              <main className="min-h-screen bg-cream flex items-center justify-center text-center px-6 py-24">
                <div className="auth-panel auth-panel-centered max-w-md">
                  <p className="font-display text-7xl md:text-8xl font-light text-wine/15 mb-4 tabular-nums">404</p>
                  <h1 className="font-display text-3xl font-light text-wine mb-3">Page Not Found</h1>
                  <p className="page-lead mx-auto mb-8">
                    The page you&apos;re looking for doesn&apos;t exist.
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
