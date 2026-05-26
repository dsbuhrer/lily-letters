import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingBag, Star, Download, Check, ArrowLeft,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import { useProduct, useProducts } from '../hooks/useProducts';
import useCartStore from '../store/cartStore';
import ProductCard from '../components/ProductCard';
import WishlistButton from '../components/WishlistButton';
import SeoHead from '../components/seo/SeoHead';

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { product, loading } = useProduct(id);
  const { products: allProducts } = useProducts();
  const [selectedImg, setSelectedImg] = useState(0);
  const [added, setAdded] = useState(false);
  const { addItem, openCart } = useCartStore();

  if (loading) {
    return (
      <main className="min-h-screen bg-cream pt-24 flex items-center justify-center">
        <p className="font-body text-sm text-[#2d2020]/50">Loading…</p>
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

  const prevImg = () =>
    setSelectedImg((i) => (i === 0 ? product.images.length - 1 : i - 1));
  const nextImg = () =>
    setSelectedImg((i) => (i === product.images.length - 1 ? 0 : i + 1));

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
        <nav className="flex items-center gap-2 mb-8 font-body text-xs text-[#2d2020]/40">
          <Link to="/" className="hover:text-wine transition-colors">Home</Link>
          <span>/</span>
          <Link to="/products" className="hover:text-wine transition-colors">Templates</Link>
          <span>/</span>
          <span className="text-wine">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
          {/* Images */}
          <div className="space-y-4">
            {/* Main image */}
            <div className="relative overflow-hidden bg-white aspect-[4/3]">
              <AnimatePresence mode="wait">
                <motion.img
                  key={selectedImg}
                  src={product.images[selectedImg]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  initial={{ opacity: 0, scale: 1.02 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                />
              </AnimatePresence>

              {product.images.length > 1 && (
                <>
                  <button
                    onClick={prevImg}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-cream/90 flex items-center justify-center hover:bg-cream transition-colors"
                  >
                    <ChevronLeft size={18} strokeWidth={1.5} className="text-wine" />
                  </button>
                  <button
                    onClick={nextImg}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-cream/90 flex items-center justify-center hover:bg-cream transition-colors"
                  >
                    <ChevronRight size={18} strokeWidth={1.5} className="text-wine" />
                  </button>
                </>
              )}

              {product.badge && (
                <span className={`absolute top-3 left-3 px-3 py-1 text-xs font-body font-medium tracking-wider uppercase ${
                  product.badge === 'Sale' ? 'bg-wine text-cream' : 
                  product.badge === 'New' ? 'bg-sage text-cream' :
                  'bg-gold text-cream'
                }`}>
                  {product.badge === 'Sale' && product.originalPrice
                    ? `-${Math.round((1 - product.price / product.originalPrice) * 100)}% OFF`
                    : product.badge}
                </span>
              )}
            </div>

            {/* Thumbnails */}
            {product.images.length > 1 && (
              <div className="flex gap-2">
                {product.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImg(i)}
                    className={`w-20 h-20 overflow-hidden border-2 transition-all ${
                      selectedImg === i ? 'border-wine' : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

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
              <p className="font-body text-sm text-[#2d2020]/50 mb-1">
                {product.subtitle}
              </p>
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
                <span className="font-body text-sm text-[#2d2020]/40">
                  ({product.reviews} reviews)
                </span>
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-3 mb-6">
                <span className="font-display text-4xl font-light text-wine">
                  ${product.price}
                </span>
                {product.originalPrice && (
                  <span className="font-body text-xl text-[#2d2020]/30 line-through">
                    ${product.originalPrice}
                  </span>
                )}
                {product.originalPrice && (
                  <span className="font-body text-sm bg-wine/10 text-wine px-2 py-0.5">
                    Save ${product.originalPrice - product.price}
                  </span>
                )}
              </div>

              <p className="font-body text-sm text-[#2d2020]/70 leading-relaxed mb-6">
                {product.description}
              </p>

              {/* What's included */}
              <div className="mb-6">
                <h3 className="font-body text-xs tracking-widest uppercase text-gold font-medium mb-3">
                  What's Included
                </h3>
                <ul className="space-y-1.5">
                  {product.includes.map((item) => (
                    <li key={item} className="flex items-center gap-2 font-body text-sm text-[#2d2020]/70">
                      <Check size={14} className="text-sage flex-shrink-0" strokeWidth={2} />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Colors */}
              <div className="mb-6">
                <h3 className="font-body text-xs tracking-widest uppercase text-gold font-medium mb-2">
                  Color Palette
                </h3>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map((color) => (
                    <span
                      key={color}
                      className="font-body text-xs text-[#2d2020]/60 border border-taupe px-3 py-1"
                    >
                      {color}
                    </span>
                  ))}
                </div>
              </div>

              {/* Features */}
              <div className="flex flex-wrap gap-4 mb-8 py-4 border-y border-taupe/30">
                <div className="flex items-center gap-1.5 text-xs font-body text-[#2d2020]/60">
                  <Download size={14} className="text-gold" strokeWidth={1.5} />
                  Instant Digital Download
                </div>
                <div className="flex items-center gap-1.5 text-xs font-body text-[#2d2020]/60">
                  <Check size={14} className="text-gold" strokeWidth={1.5} />
                  Editable in Free Canva
                </div>
                <div className="flex items-center gap-1.5 text-xs font-body text-[#2d2020]/60">
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

              <p className="font-body text-xs text-[#2d2020]/40 mt-3 flex items-center gap-1">
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
