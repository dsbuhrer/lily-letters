import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../../lib/api';
import SeoHead from '../../components/seo/SeoHead';
import Breadcrumbs from '../../components/blog/Breadcrumbs';
import TableOfContents from '../../components/blog/TableOfContents';
import BlogFaq from '../../components/blog/BlogFaq';
import ShareButtons from '../../components/blog/ShareButtons';
import ArticleCta from '../../components/blog/ArticleCta';
import ShopTheLook from '../../components/blog/ShopTheLook';
import NewsletterBlock from '../../components/blog/NewsletterBlock';
import BlogCard from '../../components/blog/BlogCard';

export default function BlogPostPage() {
  const { slug } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    api
      .getPost(slug)
      .then(setData)
      .catch(() => setError(true));
  }, [slug]);

  if (error) {
    return (
      <main className="min-h-screen bg-cream pt-28 flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-display text-3xl text-wine mb-4">Article not found</h1>
          <Link to="/blog" className="btn-primary">Back to blog</Link>
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="min-h-screen bg-cream pt-28 flex items-center justify-center">
        <p className="text-[#2d2020]/50">Loading…</p>
      </main>
    );
  }

  const { post, related, relatedProducts } = data;
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const url = `${origin}/blog/${post.slug}`;
  const category = post.category;

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: post.title,
      description: post.meta_description || post.excerpt,
      image: post.hero_image,
      datePublished: post.published_at,
      dateModified: post.updated_at,
      author: { '@type': 'Person', name: post.author_name },
    },
    post.faq?.length
      ? {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: post.faq.map((f) => ({
            '@type': 'Question',
            name: f.question,
            acceptedAnswer: { '@type': 'Answer', text: f.answer },
          })),
        }
      : null,
  ].filter(Boolean);

  return (
    <main className="min-h-screen bg-cream pt-28 pb-20">
      <SeoHead
        title={post.meta_title || `${post.title} | The Lily Letters Co.`}
        description={post.meta_description || post.excerpt}
        canonical={post.canonical_url || url}
        ogImage={post.og_image || post.hero_image}
        type="article"
        jsonLd={jsonLd.length === 1 ? jsonLd[0] : jsonLd}
      />

      <article className="max-w-3xl mx-auto px-6">
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: 'Blog', href: '/blog' },
            ...(category ? [{ label: category.name, href: `/blog/category/${category.slug}` }] : []),
            { label: post.title, href: `/blog/${post.slug}` },
          ]}
        />

        {post.hero_image && (
          <img
            src={post.hero_image}
            alt={post.hero_alt || post.title}
            width={1200}
            height={675}
            className="w-full aspect-[16/9] object-cover mb-8"
            fetchPriority="high"
          />
        )}

        <header className="mb-8">
          {category && (
            <Link to={`/blog/category/${category.slug}`} className="section-subtitle hover:underline">
              {category.name}
            </Link>
          )}
          <h1 className="section-heading mt-2">{post.title}</h1>
          <p className="mt-4 font-body text-sm text-[#2d2020]/60">
            {post.reading_time_minutes} min read ·{' '}
            {post.author_name} · Updated{' '}
            {new Date(post.updated_at).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </p>
        </header>

        {post.direct_answer && (
          <p className="text-lg font-body text-[#2d2020] leading-relaxed border-l-2 border-gold pl-4 mb-8">
            <strong className="text-wine">Quick answer:</strong> {post.direct_answer}
          </p>
        )}

        <TableOfContents contentHtml={post.content} />

        <div
          className="prose-blog font-body text-[#2d2020] leading-relaxed"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        <div className="mt-10 pt-8 border-t border-taupe/50">
          <ShareButtons title={post.title} url={url} image={post.hero_image} />
        </div>

        <BlogFaq faq={post.faq} />
        <ShopTheLook products={relatedProducts} />
        <ArticleCta />

        {related?.length > 0 && (
          <section className="mt-12">
            <h2 className="font-display text-2xl text-wine mb-6">Related articles</h2>
            <div className="space-y-8">
              {related.map((r) => (
                <BlogCard key={r.id} post={r} />
              ))}
            </div>
          </section>
        )}

        <NewsletterBlock source="blog" />
      </article>
    </main>
  );
}
