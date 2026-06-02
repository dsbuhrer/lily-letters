import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingBag, Trash2, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import useCartStore from '../store/cartStore';

export default function CartDrawer() {
  const { items, isOpen, closeCart, removeItem } = useCartStore();
  const subtotal = items.reduce((s, i) => s + i.price, 0);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="drawer-backdrop"
            onClick={closeCart}
            aria-label="Close cart"
          />

          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 320 }}
            className="drawer-panel"
            aria-label="Shopping cart"
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-taupe/40 bg-cream/50">
              <div className="flex items-center gap-2.5 min-w-0">
                <ShoppingBag size={20} strokeWidth={1.5} className="text-wine shrink-0" />
                <h2 className="font-display text-xl font-light text-wine truncate">
                  Your Cart
                  {items.length > 0 && (
                    <span className="font-body text-sm text-gold font-normal ml-2">
                      ({items.length} item{items.length !== 1 ? 's' : ''})
                    </span>
                  )}
                </h2>
              </div>
              <button type="button" onClick={closeCart} className="icon-btn" aria-label="Close cart">
                <X size={20} strokeWidth={1.5} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-1">
              <AnimatePresence mode="popLayout">
                {items.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="empty-state py-16"
                  >
                    <ShoppingBag size={48} strokeWidth={1} className="text-taupe mb-2" />
                    <p className="empty-state-title">Your cart is empty</p>
                    <p className="empty-state-text">
                      Discover our beautiful wedding templates
                    </p>
                    <Link to="/products" onClick={closeCart} className="btn-secondary mt-4">
                      Browse Templates
                    </Link>
                  </motion.div>
                ) : (
                  items.map((item) => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, x: 16 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -16 }}
                      className="flex gap-4 py-4 border-b border-taupe/25 last:border-0"
                    >
                      <div className="w-20 h-20 overflow-hidden flex-shrink-0 bg-cream ring-1 ring-taupe/30">
                        <img
                          src={item.images[0]}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-body text-sm font-medium text-ink truncate">
                          {item.name}
                        </h3>
                        <p className="font-body text-xs text-gold mt-0.5">
                          Digital Download · PDF with Canva Links
                        </p>
                        <div className="flex items-center justify-end gap-3 mt-2">
                          <span className="font-display text-base font-light text-wine">
                            ${item.price.toFixed(2)}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeItem(item.id)}
                            className="icon-btn text-red-700/80 hover:text-red-800 hover:bg-red-50"
                            aria-label="Remove from cart"
                          >
                            <Trash2 size={15} strokeWidth={1.5} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>

            {items.length > 0 && (
              <div className="px-6 py-5 border-t border-taupe/40 bg-cream/60 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-body text-sm text-ink-muted">Subtotal</span>
                  <span className="font-display text-xl font-light text-wine">
                    ${subtotal.toFixed(2)}
                  </span>
                </div>
                <p className="font-body text-xs text-ink-subtle leading-relaxed">
                  Instant digital download after purchase
                </p>
                <Link to="/checkout" onClick={closeCart} className="btn-primary w-full">
                  Proceed to Checkout
                  <ChevronRight size={16} strokeWidth={2} />
                </Link>
                <Link
                  to="/products"
                  onClick={closeCart}
                  className="block text-center link-subtle"
                >
                  Continue Shopping
                </Link>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
