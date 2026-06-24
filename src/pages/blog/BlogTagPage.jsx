import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../../lib/api';
import { nameFromSlug } from '../../lib/blogTags';
import SeoHead from '../../components/seo/SeoHead';
import Breadcrumbs from '../../components/blog/Breadcrumbs';
import BlogCard from '../../components/blog/BlogCard';

export default function BlogTagPage() {
  const { slug } = useParams();
  const [posts, setPosts] = useState([]);
  const [tag, setTag] = useState(null);
  const [loading, setLoading] = useState(true);

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const fallbackName = nameFromSlug(slug || '');
  const name = tag?.name || fallbackName;
  const description = `Wedding articles and expert guides about ${name.toLowerCase()} — invitations, signage, and stationery inspiration from The Lily Letters Co.`;

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    Promise.all([api.getTag(slug), api.getPosts({ tag: slug, limit: 24 })])
      .then(([tagRes, listing]) => {
        setTag(tagRes.tag);
        setPosts(listing.posts || []);
      })
      .catch(() => {
        setTag({ slug, name: nameFromSlug(slug) });
        setPosts([]);
      })
      .finally(() => setLoading(false));
  }, [slug]);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${name} — Wedding Blog`,
    description,
    url: `${origin}/blog/tag/${slug}`,
    isPartOf: { '@type': 'Blog', name: 'The Lily Letters Co. Blog', url: `${origin}/blog` },
  };

  return (
    <main className="min-h-screen bg-cream pt-28 pb-20">
      <SeoHead
        title={`${name} | Wedding Blog | The Lily Letters Co.`}
        description={description}
        canonical={`${origin}/blog/tag/${slug}`}
        keywords={[name, 'wedding blog', 'wedding inspiration']}
        jsonLd={jsonLd}
      />
      <div className="max-w-3xl mx-auto px-6">
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: 'Blog', href: '/blog' },
            { label: name, href: `/blog/tag/${slug}` },
          ]}
        />
        <header className="mb-10">
          <p className="section-subtitle mb-2">Topic</p>
          <h1 className="section-heading">{name}</h1>
          <p className="mt-3 font-body text-sm text-ink-muted leading-relaxed">{description}</p>
          {!loading && tag?.post_count > 0 && (
            <p className="mt-2 text-xs font-body text-ink-subtle uppercase tracking-widest">
              {tag.post_count} article{tag.post_count === 1 ? '' : 's'}
            </p>
          )}
        </header>
        <div className="space-y-12">
          {posts.map((p) => (
            <BlogCard key={p.id} post={p} />
          ))}
        </div>
        {!loading && posts.length === 0 && (
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
