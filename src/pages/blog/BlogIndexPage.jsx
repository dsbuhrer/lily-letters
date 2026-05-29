import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, TrendingUp, Flame } from 'lucide-react';
import api from '../../lib/api';
import SeoHead from '../../components/seo/SeoHead';
import BlogCard from '../../components/blog/BlogCard';
import NewsletterBlock from '../../components/blog/NewsletterBlock';
import {
  BlogCategoriesSkeleton,
  BlogPostsSkeleton,
  BlogLoadingIndicator,
} from '../../components/blog/BlogIndexSkeleton';

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5 },
};

function SidebarList({ title, icon: Icon, posts }) {
  if (!posts.length) return null;

  return (
    <div className="bg-white p-5 shadow-[0_4px_24px_-8px_rgba(76,34,51,0.1)] ring-1 ring-wine/5">
      <div className="flex items-center gap-2 mb-4">
        <span className="flex h-8 w-8 items-center justify-center bg-sage/10 text-sage">
          <Icon size={15} strokeWidth={1.5} />
        </span>
        <h2 className="font-display text-lg text-wine">{title}</h2>
      </div>
      <ul className="space-y-3">
        {posts.map((p, i) => (
          <li key={p.id}>
            <Link
              to={`/blog/${p.slug}`}
              className="group flex gap-3 items-start"
            >
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center bg-wine/5 text-[10px] font-body font-medium text-wine/50">
                {i + 1}
              </span>
              <span className="font-body text-sm text-[#2d2020]/75 leading-snug group-hover:text-wine transition-colors line-clamp-2">
                {p.title}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function BlogIndexPage() {
  const [posts, setPosts] = useState([]);
  const [trending, setTrending] = useState([]);
  const [popular, setPopular] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [q, setQ] = useState('');

  useEffect(() => {
    setLoadingPosts(true);
    Promise.all([
      api.getPosts({ limit: 12, sort: 'new' }),
      api.getPosts({ limit: 3, sort: 'trending' }),
      api.getPosts({ limit: 3, sort: 'popular' }),
    ])
      .then(([main, trend, pop]) => {
        setPosts(main.posts || []);
        setTrending(trend.posts || []);
        setPopular(pop.posts || []);
      })
      .catch(() => {
        setPosts([]);
        setTrending([]);
        setPopular([]);
      })
      .finally(() => setLoadingPosts(false));
  }, []);

  useEffect(() => {
    setLoadingCategories(true);
    api
      .getCategories()
      .then((d) => setCategories(d.categories || []))
      .catch(() => setCategories([]))
      .finally(() => setLoadingCategories(false));
  }, []);

  const search = (e) => {
    e.preventDefault();
    if (q.trim()) window.location.href = `/blog/search?q=${encodeURIComponent(q.trim())}`;
  };

  const [featured, ...rest] = posts;

  return (
    <main className="min-h-screen bg-cream">
      <SeoHead
        title="Wedding Inspiration & Planning Blog | The Lily Letters Co."
        description="Expert guides on wedding invitations, custom signage, color palettes, and printable stationery for sophisticated celebrations."
        canonical={`${typeof window !== 'undefined' ? window.location.origin : ''}/blog`}
      />

      {/* Hero */}
      <section className="relative pt-28 pb-16 md:pb-20 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/images/blog/hero-default.jpg')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-wine/80 via-wine/60 to-cream" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(151,129,82,0.15),transparent_60%)]" />

        <div className="relative z-10 max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="section-subtitle !text-cream/80 mb-3 hero-text-shadow"
          >
            The Blog
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-display text-4xl md:text-6xl font-light text-cream leading-tight text-balance hero-text-shadow"
          >
            Wedding Inspiration
            <br />
            <em className="text-gold">& Expert Guides</em>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-5 font-body text-base text-cream/75 leading-relaxed max-w-xl mx-auto hero-text-shadow"
          >
            Planning tips, signage ideas, and stationery inspiration — written for couples who want a personalized, elegant wedding.
          </motion.p>

          <motion.form
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            onSubmit={search}
            className="mt-8 max-w-md mx-auto flex overflow-hidden shadow-[0_8px_32px_-8px_rgba(0,0,0,0.35)] ring-1 ring-cream/20"
          >
            <input
              type="search"
              placeholder="Search articles…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="flex-1 px-5 py-3.5 text-sm font-body bg-cream/95 text-[#2d2020] placeholder-[#a89c96] focus:outline-none"
            />
            <button
              type="submit"
              className="px-5 bg-gold hover:bg-[#7a6a3e] text-cream transition-colors"
              aria-label="Search"
            >
              <Search size={18} strokeWidth={1.5} />
            </button>
          </motion.form>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-6 lg:px-8 pb-20 -mt-6 relative z-10">
        {(loadingCategories || loadingPosts) && (
          <BlogLoadingIndicator
            label={
              loadingCategories && loadingPosts
                ? 'Loading blog'
                : loadingCategories
                  ? 'Loading categories'
                  : 'Loading articles'
            }
          />
        )}

        {loadingCategories ? (
          <BlogCategoriesSkeleton />
        ) : (
          categories.length > 0 && (
            <motion.nav
              {...fadeUp}
              aria-label="Categories"
              className="flex flex-wrap justify-center gap-2 mb-12"
            >
              {categories.map((c) => (
                <Link
                  key={c.slug}
                  to={`/blog/category/${c.slug}`}
                  className="px-4 py-2 bg-white text-sm font-body text-wine shadow-sm ring-1 ring-wine/5 hover:bg-wine hover:text-cream hover:ring-wine transition-all duration-300"
                >
                  {c.name}
                </Link>
              ))}
            </motion.nav>
          )
        )}

        {loadingPosts ? (
          <BlogPostsSkeleton />
        ) : (
          <>
            {featured && (
              <motion.div {...fadeUp} className="mb-12">
                <BlogCard post={featured} featured />
              </motion.div>
            )}

            <div className="grid lg:grid-cols-3 gap-8 lg:gap-10 mb-16">
              <section className="lg:col-span-2">
                {rest.length > 0 ? (
                  <div className="grid sm:grid-cols-2 gap-6">
                    {rest.map((post) => (
                      <BlogCard key={post.id} post={post} />
                    ))}
                  </div>
                ) : !featured ? (
                  <p className="text-center text-[#2d2020]/50 font-body py-12">
                    Articles coming soon.
                  </p>
                ) : null}
              </section>

              <aside className="space-y-6">
                <SidebarList title="Trending" icon={TrendingUp} posts={trending} />
                <SidebarList title="Most popular" icon={Flame} posts={popular} />

                <div className="bg-gradient-to-br from-sage/15 via-white to-gold/10 p-6 ring-1 ring-sage/10">
                  <p className="font-display text-xl text-wine mb-2">Need a template?</p>
                  <p className="font-body text-sm text-[#2d2020]/60 leading-relaxed mb-4">
                    Browse editable Canva wedding stationery — download instantly and personalize every detail.
                  </p>
                  <Link
                    to="/products"
                    className="inline-flex items-center justify-center w-full bg-wine text-cream px-5 py-2.5 text-xs font-body font-medium tracking-widest uppercase hover:bg-[#3a1926] transition-colors"
                  >
                    Shop templates
                  </Link>
                </div>
              </aside>
            </div>
          </>
        )}

        <NewsletterBlock source="blog" variant="dark" />
      </div>
    </main>
  );
}
