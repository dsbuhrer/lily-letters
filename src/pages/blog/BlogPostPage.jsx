import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, Calendar } from 'lucide-react';
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

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

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
        <div className="max-w-4xl mx-auto px-6 animate-pulse space-y-6">
          <div className="h-4 w-48 bg-taupe/30" />
          <div className="w-full aspect-[21/9] bg-taupe/20" />
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
        <div className="text-center max-w-md bg-white p-10 shadow-[0_8px_40px_-12px_rgba(76,34,51,0.15)] ring-1 ring-wine/5">
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

  const formattedDate = new Date(post.updated_at).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

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
    <main className="min-h-screen bg-cream">
      <SeoHead
        title={post.meta_title || `${post.title} | The Lily Letters Co.`}
        description={post.meta_description || post.excerpt}
        canonical={post.canonical_url || url}
        ogImage={post.og_image || post.hero_image}
        type="article"
        jsonLd={jsonLd.length === 1 ? jsonLd[0] : jsonLd}
      />

      {/* Hero */}
      <header className="relative pt-28 pb-0 overflow-hidden">
        {post.hero_image ? (
          <>
            <div className="absolute inset-0">
              <img
                src={post.hero_image}
                alt=""
                aria-hidden
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-wine/70 via-wine/55 to-cream" />
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(151,129,82,0.2),transparent_55%)]" />
            </div>
            <div className="relative z-10 max-w-4xl mx-auto px-6 pb-14 md:pb-16">
              <Breadcrumbs
                light
                items={[
                  { label: 'Home', href: '/' },
                  { label: 'Blog', href: '/blog' },
                  ...(category ? [{ label: category.name, href: `/blog/category/${category.slug}` }] : []),
                  { label: post.title, href: `/blog/${post.slug}` },
                ]}
              />
              {category && (
                <Link
                  to={`/blog/category/${category.slug}`}
                  className="inline-block px-3 py-1 bg-cream/15 backdrop-blur-sm text-[11px] font-body font-medium tracking-widest uppercase text-cream/90 hover:bg-cream/25 transition-colors mb-4"
                >
                  {category.name}
                </Link>
              )}
              <motion.h1
                {...fadeUp}
                className="font-display text-4xl md:text-5xl lg:text-6xl font-light text-cream leading-tight text-balance hero-text-shadow"
              >
                {post.title}
              </motion.h1>
              <motion.div
                {...fadeUp}
                transition={{ delay: 0.1 }}
                className="mt-5 flex flex-wrap items-center gap-4 text-sm font-body text-cream/75"
              >
                <span className="inline-flex items-center gap-1.5">
                  <Clock size={14} strokeWidth={1.5} />
                  {post.reading_time_minutes} min read
                </span>
                <span className="text-cream/30">·</span>
                <span>{post.author_name}</span>
                <span className="text-cream/30">·</span>
                <span className="inline-flex items-center gap-1.5">
                  <Calendar size={14} strokeWidth={1.5} />
                  Updated {formattedDate}
                </span>
              </motion.div>
            </div>
          </>
        ) : (
          <div className="relative bg-gradient-to-b from-wine/10 to-cream pt-28 pb-10">
            <div className="max-w-4xl mx-auto px-6">
              <Breadcrumbs
                items={[
                  { label: 'Home', href: '/' },
                  { label: 'Blog', href: '/blog' },
                  ...(category ? [{ label: category.name, href: `/blog/category/${category.slug}` }] : []),
                  { label: post.title, href: `/blog/${post.slug}` },
                ]}
              />
              <motion.h1
                {...fadeUp}
                className="section-heading mt-2 text-balance"
              >
                {post.title}
              </motion.h1>
              <motion.p
                {...fadeUp}
                transition={{ delay: 0.1 }}
                className="mt-4 font-body text-sm text-[#2d2020]/60"
              >
                {post.reading_time_minutes} min read · {post.author_name} · Updated {formattedDate}
              </motion.p>
            </div>
          </div>
        )}
      </header>

      <article className="max-w-6xl mx-auto px-6 pb-20 -mt-4 relative z-10">
        <div className="grid lg:grid-cols-[1fr_280px] gap-10 lg:gap-14">
          <div className="min-w-0">
            {/* Author & tags card */}
            {(post.author_bio || post.author_avatar || post.tags?.length > 0) && (
              <motion.div
                {...fadeUp}
                className="bg-white p-6 md:p-8 shadow-[0_4px_24px_-8px_rgba(76,34,51,0.1)] ring-1 ring-wine/5 mb-8"
              >
                {(post.author_bio || post.author_avatar) && (
                  <div className="flex items-start gap-4">
                    {post.author_avatar && (
                      <img
                        src={post.author_avatar}
                        alt=""
                        width={56}
                        height={56}
                        className="w-14 h-14 rounded-full object-cover shrink-0 ring-2 ring-gold/30"
                      />
                    )}
                    <div>
                      <p className="font-display text-lg text-wine">{post.author_name}</p>
                      {post.author_bio && (
                        <p className="mt-1 font-body text-sm text-[#2d2020]/65 leading-relaxed">
                          {post.author_bio}
                        </p>
                      )}
                    </div>
                  </div>
                )}
                {post.tags?.length > 0 && (
                  <ul
                    className={`flex flex-wrap gap-2 ${post.author_bio || post.author_avatar ? 'mt-5 pt-5 border-t border-taupe/30' : ''}`}
                    aria-label="Article tags"
                  >
                    {post.tags.map((tag) => (
                      <li key={tag.slug}>
                        <Link
                          to={`/blog/tag/${tag.slug}`}
                          className="px-3 py-1 bg-sage/10 text-xs font-body font-medium tracking-wide text-sage hover:bg-sage hover:text-cream transition-colors"
                        >
                          #{tag.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </motion.div>
            )}

            {post.direct_answer && (
              <motion.div
                {...fadeUp}
                className="bg-gradient-to-r from-gold/10 via-white to-sage/5 border-l-4 border-gold p-5 md:p-6 mb-8"
              >
                <p className="text-base font-body text-[#2d2020] leading-relaxed">
                  <strong className="text-wine font-medium">Quick answer:</strong>{' '}
                  {post.direct_answer}
                </p>
              </motion.div>
            )}

            {preparedContent ? (
              <motion.div
                {...fadeUp}
                transition={{ delay: 0.05 }}
                className="prose-blog font-body text-[#2d2020] leading-relaxed bg-white p-6 md:p-10 shadow-[0_4px_24px_-8px_rgba(76,34,51,0.08)] ring-1 ring-wine/5"
                dangerouslySetInnerHTML={{ __html: preparedContent }}
              />
            ) : (
              <p className="font-body text-sm text-[#2d2020]/50">Article content is not available.</p>
            )}

            <div className="mt-8 pt-6 border-t border-taupe/40">
              <ShareButtons title={post.title} url={url} image={post.hero_image} />
            </div>

            <BlogFaq faq={post.faq} />
            <ShopTheLook products={relatedProducts} />
            <ArticleCta />
          </div>

          {/* Sidebar */}
          <aside className="hidden lg:block">
            <div className="sticky top-28 space-y-6">
              {preparedContent && <TableOfContents contentHtml={preparedContent} sticky />}
            </div>
          </aside>
        </div>

        {/* Mobile TOC */}
        {preparedContent && (
          <div className="lg:hidden mt-8">
            <TableOfContents contentHtml={preparedContent} />
          </div>
        )}

        {related?.length > 0 && (
          <section className="mt-16">
            <h2 className="font-display text-3xl text-wine mb-8 text-center">Related articles</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
