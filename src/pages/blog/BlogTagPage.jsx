import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../../lib/api';
import SeoHead from '../../components/seo/SeoHead';
import Breadcrumbs from '../../components/blog/Breadcrumbs';
import BlogCard from '../../components/blog/BlogCard';

export default function BlogTagPage() {
  const { slug } = useParams();
  const [posts, setPosts] = useState([]);
  const label = slug?.replace(/-/g, ' ') || '';

  useEffect(() => {
    api.getPosts({ tag: slug, limit: 24 }).then((r) => setPosts(r.posts || []));
  }, [slug]);

  return (
    <main className="min-h-screen bg-cream pt-28 pb-20">
      <SeoHead
        title={`${label} | Lily Letters Blog`}
        description={`Wedding articles tagged ${label}.`}
        canonical={`${typeof window !== 'undefined' ? window.location.origin : ''}/blog/tag/${slug}`}
      />
      <div className="max-w-3xl mx-auto px-6">
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: 'Blog', href: '/blog' },
            { label: label, href: `/blog/tag/${slug}` },
          ]}
        />
        <h1 className="section-heading capitalize mb-10">#{label}</h1>
        <div className="space-y-12">
          {posts.map((p) => (
            <BlogCard key={p.id} post={p} />
          ))}
        </div>
        {posts.length === 0 && (
          <p className="text-ink-subtle">
            No articles with this tag yet.{' '}
            <Link to="/blog" className="text-wine underline">
              Browse all
            </Link>
          </p>
        )}
      </div>
    </main>
  );
}
