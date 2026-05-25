import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import api from '../../lib/api';
import SeoHead from '../../components/seo/SeoHead';
import BlogCard from '../../components/blog/BlogCard';
import NewsletterBlock from '../../components/blog/NewsletterBlock';

export default function BlogIndexPage() {
  const [posts, setPosts] = useState([]);
  const [trending, setTrending] = useState([]);
  const [popular, setPopular] = useState([]);
  const [categories, setCategories] = useState([]);
  const [q, setQ] = useState('');

  useEffect(() => {
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
      .catch(() => {});

    fetch('/api/categories')
      .then((r) => r.json())
      .then((d) => setCategories(d.categories || []))
      .catch(() => setCategories([]));
  }, []);

  const search = (e) => {
    e.preventDefault();
    if (q.trim()) window.location.href = `/blog/search?q=${encodeURIComponent(q.trim())}`;
  };

  return (
    <main className="min-h-screen bg-cream pt-28 pb-20">
      <SeoHead
        title="Wedding Inspiration & Planning Blog | The Lily Letters Co."
        description="Expert guides on wedding invitations, custom signage, color palettes, and printable stationery for sophisticated celebrations."
        canonical={`${typeof window !== 'undefined' ? window.location.origin : ''}/blog`}
      />

      <div className="max-w-6xl mx-auto px-6 lg:px-8">
        <header className="text-center max-w-2xl mx-auto mb-14">
          <p className="section-subtitle mb-3">The Journal</p>
          <h1 className="section-heading">Wedding Inspiration & Expert Guides</h1>
          <p className="mt-4 font-body text-[#2d2020]/70 leading-relaxed">
            Planning tips, signage ideas, and stationery inspiration — written for couples who want a personalized, elegant wedding.
          </p>
        </header>

        <form onSubmit={search} className="max-w-md mx-auto flex gap-0 mb-10">
          <input
            type="search"
            placeholder="Search articles…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="input-field flex-1"
          />
          <button type="submit" className="px-4 bg-wine text-cream" aria-label="Search">
            <Search size={20} />
          </button>
        </form>

        {categories.length > 0 && (
          <nav aria-label="Categories" className="flex flex-wrap justify-center gap-2 mb-14">
            {categories.map((c) => (
              <Link
                key={c.slug}
                to={`/blog/category/${c.slug}`}
                className="px-4 py-2 border border-taupe text-sm text-wine hover:bg-wine hover:text-cream transition-colors"
              >
                {c.name}
              </Link>
            ))}
          </nav>
        )}

        <div className="grid lg:grid-cols-3 gap-10 mb-16">
          <aside className="lg:col-span-1 space-y-10">
            {trending.length > 0 && (
              <div>
                <h2 className="font-display text-xl text-wine mb-4">Trending</h2>
                <ul className="space-y-3">
                  {trending.map((p) => (
                    <li key={p.id}>
                      <Link to={`/blog/${p.slug}`} className="text-sm text-wine hover:underline font-body">
                        {p.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {popular.length > 0 && (
              <div>
                <h2 className="font-display text-xl text-wine mb-4">Most popular</h2>
                <ul className="space-y-3">
                  {popular.map((p) => (
                    <li key={p.id}>
                      <Link to={`/blog/${p.slug}`} className="text-sm text-wine hover:underline font-body">
                        {p.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </aside>
          <section className="lg:col-span-2 space-y-12">
            {posts.map((post) => (
              <BlogCard key={post.id} post={post} />
            ))}
            {posts.length === 0 && (
              <p className="text-center text-[#2d2020]/50 font-body">Articles coming soon.</p>
            )}
          </section>
        </div>

        <NewsletterBlock source="blog" />
      </div>
    </main>
  );
}
