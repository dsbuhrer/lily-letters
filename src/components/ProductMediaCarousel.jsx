import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Play } from 'lucide-react';

function buildMedia(images = [], videos = []) {
  return [
    ...images.map((url) => ({ type: 'image', url })),
    ...videos.map((url) => ({ type: 'video', url })),
  ];
}

export default function ProductMediaCarousel({ images = [], videos = [], name, badge, originalPrice, price }) {
  const media = useMemo(() => buildMedia(images, videos), [images, videos]);
  const [selected, setSelected] = useState(0);

  if (!media.length) return null;

  const current = media[selected] || media[0];
  const poster = images[0];

  const prev = () => setSelected((i) => (i === 0 ? media.length - 1 : i - 1));
  const next = () => setSelected((i) => (i === media.length - 1 ? 0 : i + 1));

  return (
    <div className="space-y-4">
      <div className="relative overflow-hidden bg-white aspect-[4/3]">
        <AnimatePresence mode="wait">
          {current.type === 'video' ? (
            <motion.video
              key={`video-${current.url}`}
              src={current.url}
              controls
              playsInline
              preload="metadata"
              poster={poster}
              className="w-full h-full object-cover bg-ink"
              initial={{ opacity: 0, scale: 1.02 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
            />
          ) : (
            <motion.img
              key={`image-${current.url}`}
              src={current.url}
              alt={name}
              className="w-full h-full object-cover"
              initial={{ opacity: 0, scale: 1.02 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
            />
          )}
        </AnimatePresence>

        {media.length > 1 && (
          <>
            <button
              type="button"
              onClick={prev}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-cream/90 flex items-center justify-center hover:bg-cream transition-colors"
              aria-label="Previous media"
            >
              <ChevronLeft size={18} strokeWidth={1.5} className="text-wine" />
            </button>
            <button
              type="button"
              onClick={next}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-cream/90 flex items-center justify-center hover:bg-cream transition-colors"
              aria-label="Next media"
            >
              <ChevronRight size={18} strokeWidth={1.5} className="text-wine" />
            </button>
          </>
        )}

        {badge && (
          <span
            className={`absolute top-3 left-3 px-3 py-1 text-xs font-body font-medium tracking-wider uppercase ${
              badge === 'Sale'
                ? 'bg-wine text-cream'
                : badge === 'New'
                  ? 'bg-sage text-cream'
                  : 'bg-gold text-cream'
            }`}
          >
            {badge === 'Sale' && originalPrice
              ? `-${Math.round((1 - price / originalPrice) * 100)}% OFF`
              : badge}
          </span>
        )}
      </div>

      {media.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {media.map((item, i) => (
            <button
              key={`${item.type}-${item.url}`}
              type="button"
              onClick={() => setSelected(i)}
              className={`relative w-20 h-20 shrink-0 overflow-hidden border-2 transition-all ${
                selected === i ? 'border-wine' : 'border-transparent opacity-60 hover:opacity-100'
              }`}
              aria-label={item.type === 'video' ? 'View video' : 'View image'}
            >
              {item.type === 'video' ? (
                <>
                  {poster ? (
                    <img src={poster} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-ink/10" />
                  )}
                  <div className="absolute inset-0 flex items-center justify-center bg-ink/30">
                    <Play size={16} className="text-cream" fill="currentColor" />
                  </div>
                </>
              ) : (
                <img src={item.url} alt="" className="w-full h-full object-cover" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
