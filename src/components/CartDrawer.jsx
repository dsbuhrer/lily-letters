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
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm"
            onClick={closeCart}
          />

          {/* Drawer */}
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-cream shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-taupe/30">
              <div className="flex items-center gap-2">
                <ShoppingBag size={20} strokeWidth={1.5} className="text-wine" />
                <h2 className="font-display text-xl font-light text-wine">
                  Your Cart
                  {items.length > 0 && (
                    <span className="font-body text-sm text-gold ml-2">
                      ({items.length} item{items.length !== 1 ? 's' : ''})
                    </span>
                  )}
                </h2>
              </div>
              <button
                onClick={closeCart}
                className="p-1.5 text-[#2d2020] hover:text-wine transition-colors"
              >
                <X size={20} strokeWidth={1.5} />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              <AnimatePresence>
                {items.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center h-full gap-4 py-16"
                  >
                    <ShoppingBag size={48} strokeWidth={1} className="text-taupe" />
                    <p className="font-display text-xl text-[#2d2020]/60 font-light">
                      Your cart is empty
                    </p>
                    <p className="font-body text-sm text-[#2d2020]/40 text-center">
                      Discover our beautiful wedding templates
                    </p>
                    <Link
                      to="/products"
                      onClick={closeCart}
                      className="btn-secondary mt-2"
                    >
                      Browse Templates
                    </Link>
                  </motion.div>
                ) : (
                  items.map((item) => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="flex gap-4 pb-4 border-b border-taupe/20 last:border-0"
                    >
                      <div className="w-20 h-20 overflow-hidden flex-shrink-0">
                        <img
                          src={item.images[0]}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-body text-sm font-medium text-[#2d2020] truncate">
                          {item.name}
                        </h3>
                        <p className="font-body text-xs text-gold mt-0.5">
                          Digital Download · PDF with Canva Links
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-3 ml-auto">
                            <span className="font-body text-sm font-medium text-wine">
                              ${item.price.toFixed(2)}
                            </span>
                            <button
                              type="button"
                              onClick={() => removeItem(item.id)}
                              className="text-red-600 hover:text-red-700 transition-colors"
                              aria-label="Remove from cart"
                            >
                              <Trash2 size={14} strokeWidth={1.5} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="px-6 py-5 border-t border-taupe/30 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-body text-sm text-[#2d2020]/70">Subtotal</span>
                  <span className="font-display text-xl font-light text-wine">
                    ${subtotal.toFixed(2)}
                  </span>
                </div>
                <p className="font-body text-xs text-[#2d2020]/50">
                  ✓ Instant digital download after purchase
                </p>
                <Link
                  to="/checkout"
                  onClick={closeCart}
                  className="btn-primary w-full"
                >
                  Proceed to Checkout
                  <ChevronRight size={16} strokeWidth={2} />
                </Link>
                <Link
                  to="/products"
                  onClick={closeCart}
                  className="block text-center font-body text-sm text-[#2d2020]/60 hover:text-wine transition-colors"
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
