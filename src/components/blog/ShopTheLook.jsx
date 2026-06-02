import { useMemo, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import ProductCard from '../ProductCard';

export default function ShopTheLook({ products = [] }) {
  if (!products.length) return null;

  const containerRef = useRef(null);
  const isCarousel = products.length > 2;

  const visibleProducts = useMemo(() => {
    if (isCarousel) return products;
    return products.slice(0, 2);
  }, [isCarousel, products]);

  const scrollByCards = (direction) => {
    const el = containerRef.current;
    if (!el) return;

    const card = el.querySelector('[data-carousel-card]');
    const cardWidth = card?.getBoundingClientRect?.().width || 320;
    const gap = 16;
    const amount = (cardWidth + gap) * 1.05 * direction;
    el.scrollBy({ left: amount, behavior: 'smooth' });
  };

  return (
    <section className="mt-12">
      <h2 className="font-display text-3xl text-wine mb-2">Shop the look</h2>
      <p className="font-body text-sm text-ink-muted mb-6">
        Editable Canva templates to match this inspiration.
      </p>
      {isCarousel ? (
        <div className="relative">
          <div className="hidden sm:flex items-center gap-2 absolute right-0 -top-12">
            <button
              type="button"
              onClick={() => scrollByCards(-1)}
              className="h-9 w-9 inline-flex items-center justify-center bg-white text-wine ring-1 ring-wine/10 hover:bg-wine hover:text-cream transition-colors"
              aria-label="Scroll left"
            >
              <ChevronLeft size={18} strokeWidth={1.5} />
            </button>
            <button
              type="button"
              onClick={() => scrollByCards(1)}
              className="h-9 w-9 inline-flex items-center justify-center bg-white text-wine ring-1 ring-wine/10 hover:bg-wine hover:text-cream transition-colors"
              aria-label="Scroll right"
            >
              <ChevronRight size={18} strokeWidth={1.5} />
            </button>
          </div>

          <div
            ref={containerRef}
            className="flex gap-4 overflow-x-auto no-scrollbar scroll-smooth snap-x snap-mandatory pb-2"
          >
            {visibleProducts.map((p) => (
              <div
                key={p.id}
                data-carousel-card
                className="snap-start shrink-0 w-[84%] sm:w-[360px]"
              >
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {visibleProducts.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </section>
  );
}
