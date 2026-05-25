import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../../lib/api';
import SeoHead from '../../components/seo/SeoHead';
import BlogCard from '../../components/blog/BlogCard';

export default function BlogSearchPage() {
  const [params] = useSearchParams();
  const q = params.get('q') || '';
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    if (q) api.getPosts({ q, limit: 24 }).then((r) => setPosts(r.posts || []));
  }, [q]);

  return (
    <main className="min-h-screen bg-cream pt-28 pb-20">
      <SeoHead title={`Search: ${q} | Lily Letters Blog`} description={`Search results for ${q}`} />
      <div className="max-w-3xl mx-auto px-6">
        <h1 className="section-heading mb-2">Search results</h1>
        <p className="font-body text-sm text-[#2d2020]/60 mb-10">
          {posts.length} result{posts.length !== 1 ? 's' : ''} for &ldquo;{q}&rdquo;
        </p>
        <div className="space-y-12">
          {posts.map((p) => (
            <BlogCard key={p.id} post={p} />
          ))}
        </div>
        {posts.length === 0 && q && (
          <p className="text-[#2d2020]/50">
            No matches. <Link to="/blog" className="text-wine underline">Browse the blog</Link>
          </p>
        )}
      </div>
    </main>
  );
}
