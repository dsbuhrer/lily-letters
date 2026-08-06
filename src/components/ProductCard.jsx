import { useState } from 'react';

import { Link } from 'react-router-dom';

import { motion } from 'framer-motion';

import { ShoppingBag, Star, Eye } from 'lucide-react';

import useCartStore from '../store/cartStore';

import WishlistButton from './WishlistButton';



export default function ProductCard({ product, index = 0 }) {

  const [hovered, setHovered] = useState(false);

  const [imgIdx, setImgIdx] = useState(0);

  const { addItem, openCart } = useCartStore();



  const handleAddToCart = (e) => {

    e.preventDefault();

    e.stopPropagation();

    addItem(product);

    openCart();

  };



  return (

    <motion.div

      initial={{ opacity: 0, y: 30 }}

      whileInView={{ opacity: 1, y: 0 }}

      viewport={{ once: true, margin: '-50px' }}

      transition={{ duration: 0.5, delay: index * 0.1 }}

      className="group h-full flex flex-col"

    >

      <div

        className="relative overflow-hidden bg-white shrink-0 ring-1 ring-taupe/25 shadow-soft"

        onMouseEnter={() => {

          setHovered(true);

          if (product.images.length > 1) setImgIdx(1);

        }}

        onMouseLeave={() => {

          setHovered(false);

          setImgIdx(0);

        }}

      >

        <Link to={`/products/${product.id}`} className="block">

          <div className="relative overflow-hidden aspect-[3/4]">

            <motion.img

              key={imgIdx}

              src={product.images[imgIdx]}

              alt={product.name}

              className="w-full h-full object-cover"

              initial={{ opacity: 0 }}

              animate={{ opacity: 1 }}

              transition={{ duration: 0.4 }}

            />



            <motion.div

              initial={{ opacity: 0 }}

              animate={{ opacity: hovered ? 1 : 0 }}

              transition={{ duration: 0.2 }}

              className="absolute inset-0 bg-black/20 flex items-center justify-center pointer-events-none"

            >

              <span className="flex items-center gap-2 bg-cream/95 px-4 py-2 text-xs font-body font-medium tracking-widest uppercase text-wine">

                <Eye size={14} strokeWidth={1.5} />

                Quick View

              </span>

            </motion.div>

          </div>

        </Link>



        <div className="absolute top-3 right-3 z-10">

          <WishlistButton product={product} variant="icon" />

        </div>



        {product.badge && (

          <span

            className={`absolute top-3 left-3 px-2.5 py-1 text-xs font-body font-medium tracking-wider uppercase ${

              product.badge === 'Sale'

                ? 'bg-wine text-cream'

                : product.badge === 'New'

                ? 'bg-sage text-cream'

                : 'bg-gold text-cream'

            }`}

          >

            {product.badge === 'Sale' && product.originalPrice

              ? `-${Math.round((1 - product.price / product.originalPrice) * 100)}%`

              : product.badge}

          </span>

        )}



        <motion.button

          initial={{ y: 10, opacity: 0 }}

          animate={{ y: hovered ? 0 : 10, opacity: hovered ? 1 : 0 }}

          transition={{ duration: 0.2 }}

          onClick={handleAddToCart}

          className="absolute bottom-0 left-0 right-0 bg-wine/95 text-cream py-3 hidden sm:flex items-center justify-center gap-2 text-xs font-body font-medium tracking-widest uppercase hover:bg-wine transition-colors"

        >

          <ShoppingBag size={14} strokeWidth={1.5} />

          Add to Cart

        </motion.button>

      </div>



      <div className="pt-3 pb-1 flex flex-col flex-1 min-h-0">

        <Link to={`/products/${product.id}`} className="block">

          <p className="font-body text-xs tracking-widest uppercase text-gold mb-1">

            {product.category.replace(/-/g, ' ')}

          </p>

          <h3 className="font-display text-sm sm:text-lg font-light text-ink leading-snug group-hover:text-wine transition-colors line-clamp-2 min-h-[2.5rem] sm:min-h-[3.25rem]">

            {product.name}

          </h3>

        </Link>

        <div className="flex items-center justify-between mt-1.5 flex-wrap gap-y-1 shrink-0">

          {product.reviews > 0 ? (
            <div className="flex items-center gap-1">

              <div className="flex">

                {Array.from({ length: 5 }).map((_, i) => (

                  <Star

                    key={i}

                    size={10}

                    strokeWidth={0}

                    fill={i < Math.floor(product.rating || 0) ? '#978152' : '#d4cbc4'}

                  />

                ))}

              </div>

              <span className="font-body text-xs text-ink-subtle hidden sm:inline">

                ({product.reviews})

              </span>

            </div>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-1.5">

            {product.originalPrice && (

              <span className="font-body text-xs text-ink-faint line-through hidden sm:inline">

                ${product.originalPrice.toFixed(2)}

              </span>

            )}

            <span className="font-display text-base sm:text-lg font-light text-wine">

              ${product.price.toFixed(2)}

            </span>

          </div>

        </div>



        <button

          type="button"

          onClick={handleAddToCart}

          className="w-full mt-auto pt-2.5 shrink-0 flex sm:hidden items-center justify-center gap-1.5 py-2.5 bg-wine text-cream text-xs font-body font-medium tracking-widest uppercase hover:bg-[#3a1926] transition-colors"

        >

          <ShoppingBag size={14} strokeWidth={1.5} />

          Cart

        </button>

        <button

          type="button"

          onClick={handleAddToCart}

          className="w-full mt-auto pt-2.5 shrink-0 hidden sm:flex items-center justify-center gap-1.5 py-2 border border-wine bg-wine text-cream text-xs font-body font-medium tracking-widest uppercase hover:bg-[#3a1926] transition-colors"

        >

          <ShoppingBag size={14} strokeWidth={1.5} />

          Add to Cart

        </button>

      </div>

    </motion.div>

  );

}

