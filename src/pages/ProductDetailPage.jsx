import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ShoppingBag, Star, Download, Check, ArrowLeft,
} from 'lucide-react';
import { useProduct, useProducts } from '../hooks/useProducts';
import useCartStore from '../store/cartStore';
import ProductCard from '../components/ProductCard';
import WishlistButton from '../components/WishlistButton';
import SeoHead from '../components/seo/SeoHead';
import ProductMediaCarousel from '../components/ProductMediaCarousel';

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { product, loading } = useProduct(id);
  const { products: allProducts } = useProducts();
  const [added, setAdded] = useState(false);
  const { addItem, openCart } = useCartStore();

  if (loading) {
    return (
      <main className="min-h-screen bg-cream pt-24 flex items-center justify-center">
        <p className="font-body text-sm text-ink-subtle">Loading…</p>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="min-h-screen bg-cream pt-24 flex items-center justify-center">
        <div className="text-center">
          <p className="font-display text-2xl text-wine">Product not found</p>
          <Link to="/products" className="btn-primary mt-4 inline-flex">
            Back to Shop
          </Link>
        </div>
      </main>
    );
  }

  const related = allProducts
    .filter((p) => p.id !== product.id && p.category === product.category)
    .slice(0, 4);

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const productUrl = `${origin}/products/${product.slug || product.id}`;
  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description || product.subtitle,
    image: product.images?.[0],
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
      url: productUrl,
    },
  };

  const handleAddToCart = () => {
    addItem(product);
    setAdded(true);
    setTimeout(() => {
      setAdded(false);
      openCart();
    }, 1200);
  };

  return (
    <>
      <SeoHead
        title={`${product.name} | The Lily Letters Co.`}
        description={
          product.description?.slice(0, 155) ||
          product.subtitle ||
          `Editable wedding template — ${product.name}. Instant Canva download.`
        }
        canonical={productUrl}
        ogImage={product.images?.[0]}
        type="product"
        jsonLd={productJsonLd}
      />
    <main className="min-h-screen bg-cream pt-20">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 mb-8 font-body text-xs text-ink-faint">
          <Link to="/" className="hover:text-wine transition-colors">Home</Link>
          <span>/</span>
          <Link to="/products" className="hover:text-wine transition-colors">Templates</Link>
          <span>/</span>
          <span className="text-wine">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
          {/* Images & videos */}
          <ProductMediaCarousel
            images={product.images}
            videos={product.videos}
            name={product.name}
            badge={product.badge}
            originalPrice={product.originalPrice}
            price={product.price}
          />

          {/* Info */}
          <div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <p className="section-subtitle mb-2">
                {product.category.replace(/-/g, ' ')}
              </p>
              <h1 className="font-display text-4xl font-light text-wine leading-tight mb-1">
                {product.name}
              </h1>
              <p className="font-body text-sm text-ink-subtle mb-1">
                {product.subtitle}
              </p>
              {product.sku && (
                <p className="font-body text-xs text-ink-faint font-mono mb-1">
                  SKU: {product.sku}
                </p>
              )}
              {product.collection && (
                <p className="font-body text-xs tracking-widest uppercase text-gold/80 mb-4">
                  {product.collection} Collection
                </p>
              )}

              {/* Rating */}
              <div className="flex items-center gap-2 mb-5">
                <div className="flex">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      size={14}
                      strokeWidth={0}
                      fill={i < Math.floor(product.rating) ? '#978152' : '#d4cbc4'}
                    />
                  ))}
                </div>
                <span className="font-body text-sm text-gold">{product.rating}</span>
                <span className="font-body text-sm text-ink-faint">
                  ({product.reviews} reviews)
                </span>
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-3 mb-6">
                <span className="font-display text-4xl font-light text-wine">
                  ${product.price}
                </span>
                {product.originalPrice && (
                  <span className="font-body text-xl text-ink/30 line-through">
                    ${product.originalPrice}
                  </span>
                )}
                {product.originalPrice && (
                  <span className="font-body text-sm bg-wine/10 text-wine px-2 py-0.5">
                    Save ${product.originalPrice - product.price}
                  </span>
                )}
              </div>

              <p className="font-body text-sm text-ink-muted leading-relaxed whitespace-pre-wrap mb-6">
                {product.description}
              </p>

              {/* Features */}
              <div className="flex flex-wrap gap-4 mb-8 py-4 border-y border-taupe/30">
                <div className="flex items-center gap-1.5 text-xs font-body text-ink-muted">
                  <Download size={14} className="text-gold" strokeWidth={1.5} />
                  Instant Digital Download
                </div>
                <div className="flex items-center gap-1.5 text-xs font-body text-ink-muted">
                  <Check size={14} className="text-gold" strokeWidth={1.5} />
                  Editable in Free Canva
                </div>
                <div className="flex items-center gap-1.5 text-xs font-body text-ink-muted">
                  <Check size={14} className="text-gold" strokeWidth={1.5} />
                  Print at Home or Anywhere
                </div>
              </div>

              {/* CTA */}
              <div className="flex flex-col sm:flex-row gap-3">
                <motion.button
                  onClick={handleAddToCart}
                  whileTap={{ scale: 0.97 }}
                  className={`flex-1 flex items-center justify-center gap-2 py-4 font-body text-sm font-medium tracking-widest uppercase transition-all duration-300 ${
                    added
                      ? 'bg-sage text-cream cursor-default'
                      : 'bg-wine text-cream hover:bg-[#3a1926]'
                  }`}
                >
                  {added ? (
                    <>
                      <Check size={16} strokeWidth={2} />
                      Added to Cart!
                    </>
                  ) : (
                    <>
                      <ShoppingBag size={16} strokeWidth={1.5} />
                      Add to Cart
                    </>
                  )}
                </motion.button>
                <WishlistButton product={product} variant="detail" />
              </div>

              <p className="font-body text-xs text-ink-faint mt-3 flex items-center gap-1">
                <Check size={12} className="text-sage" />
                Secure checkout · Instant PDF with all Canva links
              </p>
            </motion.div>
          </div>
        </div>

        {/* Related */}
        {related.length > 0 && (
          <section className="mt-20 pt-12 border-t border-taupe/20">
            <h2 className="font-display text-3xl font-light text-wine mb-8">
              You May Also Love
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
              {related.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} />
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
    </>
  );
}
