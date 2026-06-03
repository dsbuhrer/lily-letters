import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, ChevronDown, SlidersHorizontal } from 'lucide-react';
import { useProducts } from '../hooks/useProducts';
import { useProductCategories } from '../hooks/useProductCategories';
import ProductCard from '../components/ProductCard';

const sortOptions = [
  { value: 'default', label: 'Featured' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Top Rated' },
  { value: 'reviews', label: 'Most Reviewed' },
];

export default function ProductsPage() {
  const { products } = useProducts();
  const { grouped: groupedCategories } = useProductCategories();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('default');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const categoryParam = searchParams.get('category') || 'all';

  const countByCategory = (catId) => {
    if (catId === 'all') return products.length;
    return products.filter((p) => p.category === catId).length;
  };

  const setCategory = (cat) => {
    if (cat === 'all') {
      searchParams.delete('category');
    } else {
      searchParams.set('category', cat);
    }
    setSearchParams(searchParams);
    setSidebarOpen(false);
  };

  const filtered = products
    .filter((p) => {
      const matchCat = categoryParam === 'all' || p.category === categoryParam;
      const matchSearch =
        search === '' ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.tags.some((t) => t.includes(search.toLowerCase()));
      return matchCat && matchSearch;
    })
    .sort((a, b) => {
      switch (sort) {
        case 'price-asc': return a.price - b.price;
        case 'price-desc': return b.price - a.price;
        case 'rating': return b.rating - a.rating;
        case 'reviews': return b.reviews - a.reviews;
        default: return 0;
      }
    });

  const activeCategoryLabel =
    groupedCategories.find((c) => c.type === 'item' && c.id === categoryParam)?.label || 'All Templates';

  return (
    <main className="min-h-screen bg-cream pt-20">
      {/* Page Header */}
      <section className="bg-[#f8f5ef] border-b border-taupe/20 py-12">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <p className="section-subtitle mb-3">The Lily Letters Co</p>
            <h1 className="section-heading">Wedding Templates</h1>
            <p className="font-body text-sm text-ink-muted mt-3 max-w-md mx-auto">
              {products.length} beautifully crafted, editable stationery designs for your perfect day
            </p>
          </motion.div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Mobile: filter toggle + toolbar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          {/* Search */}
          <div className="relative w-full sm:w-72">
            <Search size={16} strokeWidth={1.5} className="absolute left-3 top-1/2 -translate-y-1/2 text-gold" />
            <input
              type="text"
              placeholder="Search templates..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-9 pr-8"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-taupe hover:text-wine">
                <X size={14} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Mobile: filter button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden flex items-center gap-2 px-4 py-2 border border-taupe text-xs font-body font-medium tracking-wider uppercase text-ink-muted hover:border-wine hover:text-wine transition-colors"
            >
              <SlidersHorizontal size={14} />
              {activeCategoryLabel}
            </button>

            <span className="font-body text-sm text-ink-subtle hidden sm:block ml-auto">
              {filtered.length} results
            </span>

            {/* Sort */}
            <div className="relative">
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="appearance-none input-field pr-8 cursor-pointer"
              >
                {sortOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gold pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Layout: sidebar + grid */}
        <div className="flex gap-8">

          {/* Sidebar — desktop always visible, mobile as drawer */}
          {/* Mobile drawer backdrop */}
          <AnimatePresence>
            {sidebarOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/30 z-40 lg:hidden"
                onClick={() => setSidebarOpen(false)}
              />
            )}
          </AnimatePresence>

          {/* Sidebar panel */}
          <motion.aside
            className={`
              fixed top-0 left-0 h-full w-72 bg-cream z-50 overflow-y-auto pt-20 pb-8 px-6 shadow-xl
              lg:static lg:h-auto lg:w-56 lg:shrink-0 lg:shadow-none lg:pt-0 lg:pb-0 lg:px-0 lg:z-auto lg:overflow-visible
              transition-transform duration-300
              ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}
          >
            {/* Mobile close */}
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden absolute top-4 right-4 text-taupe hover:text-wine"
            >
              <X size={20} />
            </button>

            <nav className="space-y-0.5">
              {groupedCategories.map((item, idx) => {
                if (item.type === 'group') {
                  return (
                    <p
                      key={`group-${idx}`}
                      className="font-body text-[10px] font-semibold tracking-[0.15em] uppercase text-ink-faint pt-5 pb-1.5 first:pt-0"
                    >
                      {item.label}
                    </p>
                  );
                }

                const isSubItem = item.group !== null && item.id !== 'all';
                const count = countByCategory(item.id);
                const isActive = categoryParam === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => setCategory(item.id)}
                    className={`
                      w-full flex items-center justify-between text-left px-2 py-1.5 rounded transition-colors duration-150
                      ${isSubItem ? 'pl-4' : ''}
                      ${isActive
                        ? 'text-wine font-medium bg-wine/5'
                        : 'text-ink-muted hover:text-wine hover:bg-wine/5'
                      }
                    `}
                  >
                    <span className={`font-body text-sm ${isSubItem ? '' : 'font-medium'}`}>
                      {isSubItem && <span className="text-taupe mr-1">—</span>}
                      {item.label}
                    </span>
                    <span className="font-body text-xs text-ink-faint ml-2">{count}</span>
                  </button>
                );
              })}
            </nav>
          </motion.aside>

          {/* Product Grid */}
          <div className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              {filtered.length > 0 ? (
                <motion.div
                  key={`${categoryParam}-${search}-${sort}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-3 sm:gap-6 items-stretch"
                >
                  {filtered.map((product, i) => (
                    <ProductCard key={product.id} product={product} index={i} />
                  ))}
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-24 gap-4"
                >
                  <p className="font-display text-2xl text-ink-faint font-light">No templates found</p>
                  <p className="font-body text-sm text-ink/30">Try adjusting your search or category</p>
                  <button onClick={() => { setSearch(''); setCategory('all'); }} className="btn-secondary mt-2">
                    Clear Filters
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </main>
  );
}
