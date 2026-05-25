import { useEffect, useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { Search, ArrowLeft } from 'lucide-react';
import api from '../../lib/api';
import SeoHead from '../../components/seo/SeoHead';
import BlogCard from '../../components/blog/BlogCard';

export default function BlogSearchPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const q = params.get('q') || '';
  const [searchInput, setSearchInput] = useState(q);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setSearchInput(q);
  }, [q]);

  useEffect(() => {
    if (!q.trim()) {
      setPosts([]);
      return;
    }
    setLoading(true);
    api
      .getPosts({ q, limit: 24 })
      .then((r) => setPosts(r.posts || []))
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  }, [q]);

  const handleSearch = (e) => {
    e.preventDefault();
    const term = searchInput.trim();
    if (term) navigate(`/blog/search?q=${encodeURIComponent(term)}`);
  };

  return (
    <main className="min-h-screen bg-cream pt-28 pb-20">
      <SeoHead title={`Search: ${q || 'Blog'} | Lily Letters Blog`} description={`Search results for ${q}`} />
      <div className="max-w-3xl mx-auto px-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <h1 className="section-heading mb-0">Search results</h1>
          <Link to="/blog" className="btn-ghost inline-flex items-center gap-2 text-sm shrink-0">
            <ArrowLeft size={16} strokeWidth={1.5} />
            Back to blog
          </Link>
        </div>

        <form onSubmit={handleSearch} className="flex gap-0 max-w-md mb-8">
          <input
            type="search"
            placeholder="Search for another term…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="input-field flex-1"
            aria-label="Search articles"
          />
          <button type="submit" className="px-4 bg-wine text-cream hover:bg-wine/90 transition-colors" aria-label="Search again">
            <Search size={20} />
          </button>
        </form>

        {q.trim() ? (
          <p className="font-body text-sm text-[#2d2020]/60 mb-10">
            {loading
              ? 'Searching…'
              : `${posts.length} result${posts.length !== 1 ? 's' : ''} for “${q}”`}
          </p>
        ) : (
          <p className="font-body text-sm text-[#2d2020]/60 mb-10">
            Enter a term above to search the blog.
          </p>
        )}

        <div className="space-y-12">
          {posts.map((p) => (
            <BlogCard key={p.id} post={p} />
          ))}
        </div>

        {!loading && posts.length === 0 && q.trim() && (
          <p className="text-[#2d2020]/50 font-body text-sm">
            No matches for this term. Try another keyword or{' '}
            <Link to="/blog" className="text-wine underline">
              browse all articles
            </Link>
            .
          </p>
        )}
      </div>
    </main>
  );
}
