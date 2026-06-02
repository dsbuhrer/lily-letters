import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Heart, ArrowRight } from 'lucide-react';
import useWishlistStore from '../store/wishlistStore';
import ProductCard from '../components/ProductCard';

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6 },
};

export default function WishlistPage() {
  const { items } = useWishlistStore();

  return (
    <main className="min-h-screen bg-cream">
      <section className="relative pt-28 pb-12 overflow-hidden">
        <div className="absolute inset-0 bg-wine/5 pointer-events-none" />
        <div className="max-w-3xl mx-auto px-6 text-center">
          <motion.p {...fadeUp} className="section-subtitle">
            Saved for Later
          </motion.p>
          <motion.h1
            {...fadeUp}
            transition={{ delay: 0.1 }}
            className="font-display text-4xl md:text-5xl font-light text-wine mt-2"
          >
            Your Wishlist
          </motion.h1>
          <motion.p
            {...fadeUp}
            transition={{ delay: 0.2 }}
            className="font-body text-sm text-ink-muted mt-4 max-w-lg mx-auto"
          >
            {items.length > 0
              ? `${items.length} template${items.length !== 1 ? 's' : ''} you have saved. Add them to your cart whenever you are ready.`
              : 'Save templates you love with the heart icon on any product — they will appear here.'}
          </motion.p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 lg:px-8 pb-20">
        {items.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <Heart size={56} strokeWidth={1} className="text-taupe mb-6" />
            <h2 className="font-display text-2xl font-light text-wine mb-3">
              Your wishlist is empty
            </h2>
            <p className="font-body text-sm text-ink-subtle max-w-md mb-8">
              Browse our wedding templates and tap the heart on any design to save it here.
            </p>
            <Link to="/products" className="btn-primary inline-flex items-center gap-2">
              Browse Templates
              <ArrowRight size={16} strokeWidth={2} />
            </Link>
          </motion.div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6 items-stretch">
            {items.map((product, i) => (
              <ProductCard key={product.id} product={product} index={i} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
