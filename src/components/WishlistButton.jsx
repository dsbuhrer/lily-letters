import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import useWishlistStore from '../store/wishlistStore';

export default function WishlistButton({
  product,
  variant = 'icon',
  className = '',
  onToggle,
}) {
  const { toggleItem, isInWishlist } = useWishlistStore();
  const saved = isInWishlist(product.id);

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const added = toggleItem(product);
    onToggle?.(added);
  };

  if (variant === 'detail') {
    return (
      <motion.button
        type="button"
        onClick={handleClick}
        whileTap={{ scale: 0.97 }}
        aria-label={saved ? 'Remove from wishlist' : 'Add to wishlist'}
        aria-pressed={saved}
        className={`flex items-center justify-center gap-2 min-w-[3.5rem] px-5 py-4 border transition-all duration-300 ${
          saved
            ? 'border-wine bg-wine/8 text-wine shadow-sm'
            : 'border-taupe bg-cream text-ink-muted hover:border-wine hover:text-wine hover:bg-wine/5'
        } ${className}`}
      >
        <Heart
          size={18}
          strokeWidth={1.5}
          className={`transition-transform duration-300 ${saved ? 'scale-110' : ''}`}
          fill={saved ? 'currentColor' : 'none'}
        />
        <span className="font-body text-sm font-medium tracking-widest uppercase hidden sm:inline">
          {saved ? 'Saved' : 'Wishlist'}
        </span>
      </motion.button>
    );
  }

  if (variant === 'compact') {
    return (
      <button
        type="button"
        onClick={handleClick}
        aria-label={saved ? 'Remove from wishlist' : 'Save to wishlist'}
        aria-pressed={saved}
        className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 border text-xs font-body font-medium tracking-widest uppercase transition-all duration-200 ${
          saved
            ? 'border-wine bg-wine/8 text-wine'
            : 'border-taupe text-ink-muted hover:border-wine hover:text-wine'
        } ${className}`}
      >
        <Heart size={14} strokeWidth={1.5} fill={saved ? 'currentColor' : 'none'} />
        {saved ? 'Saved' : 'Save'}
      </button>
    );
  }

  return (
    <motion.button
      type="button"
      onClick={handleClick}
      whileTap={{ scale: 0.9 }}
      aria-label={saved ? 'Remove from wishlist' : 'Add to wishlist'}
      aria-pressed={saved}
      className={`w-9 h-9 flex items-center justify-center bg-cream/95 backdrop-blur-sm border transition-all duration-200 ${
        saved
          ? 'border-wine text-wine shadow-sm'
          : 'border-taupe/60 text-ink-subtle hover:border-wine hover:text-wine'
      } ${className}`}
    >
      <Heart size={16} strokeWidth={1.5} fill={saved ? 'currentColor' : 'none'} />
    </motion.button>
  );
}
