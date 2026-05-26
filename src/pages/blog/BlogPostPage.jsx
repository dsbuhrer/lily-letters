import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../../lib/api';
import { prepareBlogContentHtml } from '../../lib/blogContent';
import { isSupabaseConfigured } from '../../lib/supabaseClient';
import SeoHead from '../../components/seo/SeoHead';
import Breadcrumbs from '../../components/blog/Breadcrumbs';
import TableOfContents from '../../components/blog/TableOfContents';
import BlogFaq from '../../components/blog/BlogFaq';
import ShareButtons from '../../components/blog/ShareButtons';
import ArticleCta from '../../components/blog/ArticleCta';
import ShopTheLook from '../../components/blog/ShopTheLook';
import NewsletterBlock from '../../components/blog/NewsletterBlock';
import BlogCard from '../../components/blog/BlogCard';
import { BLOG_HERO_HEIGHT, BLOG_HERO_WIDTH } from '../../constants/blogHeroImage';

export default function BlogPostPage() {
  const { slug } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setError(null);
    setData(null);

    if (!isSupabaseConfigured()) {
      setError('config');
      setLoading(false);
      return;
    }

    api
      .getPost(slug)
      .then(setData)
      .catch((err) => setError(err?.message || 'not_found'))
      .finally(() => setLoading(false));
  }, [slug]);

  const preparedContent = useMemo(
    () => (data?.post?.content ? prepareBlogContentHtml(data.post.content) : ''),
    [data?.post?.content],
  );

  if (loading) {
    return (
      <main className="min-h-screen bg-cream pt-28 pb-20">
        <div className="max-w-3xl mx-auto px-6 animate-pulse space-y-6">
          <div className="h-4 w-48 bg-taupe/30" />
          <div className="w-full aspect-[16/9] bg-taupe/20" />
          <div className="h-10 w-3/4 bg-taupe/25" />
          <div className="space-y-3">
            <div className="h-4 bg-taupe/20" />
            <div className="h-4 bg-taupe/20" />
            <div className="h-4 w-5/6 bg-taupe/20" />
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-cream pt-28 flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <h1 className="font-display text-3xl text-wine mb-4">
            {error === 'config' ? 'Blog unavailable' : 'Article not found'}
          </h1>
          <p className="font-body text-sm text-[#2d2020]/60 mb-6">
            {error === 'config'
              ? 'Supabase is not configured in this build. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY, then rebuild.'
              : 'This article may have been removed or the link is incorrect.'}
          </p>
          <Link to="/blog" className="btn-primary">
            Back to blog
          </Link>
        </div>
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
            width={BLOG_HERO_WIDTH}
            height={BLOG_HERO_HEIGHT}
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
          {(post.author_bio || post.author_avatar) && (
            <div className="mt-6 flex items-start gap-4 p-4 bg-white/50 border border-taupe/40">
              {post.author_avatar && (
                <img
                  src={post.author_avatar}
                  alt=""
                  width={56}
                  height={56}
                  className="w-14 h-14 rounded-full object-cover shrink-0"
                />
              )}
              <div>
                <p className="font-display text-lg text-wine">{post.author_name}</p>
                {post.author_bio && (
                  <p className="mt-1 font-body text-sm text-[#2d2020]/70 leading-relaxed">
                    {post.author_bio}
                  </p>
                )}
              </div>
            </div>
          )}
          {post.tags?.length > 0 && (
            <ul className="mt-4 flex flex-wrap gap-2" aria-label="Article tags">
              {post.tags.map((tag) => (
                <li key={tag.slug}>
                  <Link
                    to={`/blog/tag/${tag.slug}`}
                    className="px-3 py-1 border border-taupe text-xs uppercase tracking-wider text-wine hover:bg-wine hover:text-cream transition-colors"
                  >
                    {tag.name}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </header>

        {post.direct_answer && (
          <p className="text-lg font-body text-[#2d2020] leading-relaxed border-l-2 border-gold pl-4 mb-8">
            <strong className="text-wine">Quick answer:</strong> {post.direct_answer}
          </p>
        )}

        {preparedContent && <TableOfContents contentHtml={preparedContent} />}

        {preparedContent ? (
          <div
            className="prose-blog font-body text-[#2d2020] leading-relaxed"
            dangerouslySetInnerHTML={{ __html: preparedContent }}
          />
        ) : (
          <p className="font-body text-sm text-[#2d2020]/50">Article content is not available.</p>
        )}

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
