import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../../lib/api';
import SeoHead from '../../components/seo/SeoHead';
import Breadcrumbs from '../../components/blog/Breadcrumbs';
import BlogCard from '../../components/blog/BlogCard';

export default function BlogCategoryPage() {
  const { slug } = useParams();
  const [posts, setPosts] = useState([]);
  const [name, setName] = useState(slug?.replace(/-/g, ' '));

  useEffect(() => {
    api.getPosts({ category: slug, limit: 24 }).then((r) => {
      setPosts(r.posts || []);
      if (r.posts?.[0]?.category?.name) setName(r.posts[0].category.name);
    });
  }, [slug]);

  return (
    <main className="min-h-screen bg-cream pt-28 pb-20">
      <SeoHead
        title={`${name} | Lily Letters Blog`}
        description={`Wedding articles and guides about ${name}.`}
        canonical={`${typeof window !== 'undefined' ? window.location.origin : ''}/blog/category/${slug}`}
      />
      <div className="max-w-3xl mx-auto px-6">
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: 'Blog', href: '/blog' },
            { label: name, href: `/blog/category/${slug}` },
          ]}
        />
        <h1 className="section-heading capitalize mb-10">{name}</h1>
        <div className="space-y-12">
          {posts.map((p) => (
            <BlogCard key={p.id} post={p} />
          ))}
        </div>
        {posts.length === 0 && (
          <p className="text-[#2d2020]/50">
            No articles in this category yet. <Link to="/blog" className="text-wine underline">Browse all</Link>
          </p>
        )}
      </div>
    </main>
  );
}
