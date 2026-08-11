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
import BlogAuthorCard from '../../components/blog/BlogAuthorCard';
import BlogTagList from '../../components/blog/BlogTagList';
import ArticleCta from '../../components/blog/ArticleCta';
import { mergeSeoKeywords } from '../../lib/blogTags';
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

  useEffect(() => {
    const postId = data?.post?.id;
    if (!postId || typeof window === 'undefined') return;
    const key = `post_viewed_${postId}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, '1');
    } catch {
      /* private mode / blocked storage */
    }
    api.trackPostView(postId).catch(() => {});
  }, [data?.post?.id]);

  const preparedContent = useMemo(
    () => (data?.post?.content ? prepareBlogContentHtml(data.post.content) : ''),
    [data?.post?.content],
  );

  if (loading) {
    return (
      <main className="min-h-screen bg-cream pt-28 pb-20">
        <div className="max-w-6xl mx-auto px-6 animate-pulse space-y-6">
          <div className="h-4 w-48 bg-taupe/30" />
          <div className="h-10 w-3/4 bg-taupe/25" />
          <div className="h-px w-full bg-taupe/40" />
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
          <p className="font-body text-sm text-ink-muted mb-6">
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

  const keywords = mergeSeoKeywords(post.seo_keywords, post.tags);

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
      keywords: keywords.join(', '),
      ...(post.tags?.length
        ? { about: post.tags.map((t) => ({ '@type': 'Thing', name: t.name, url: `${origin}/blog/tag/${t.slug}` })) }
        : {}),
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

  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Blog', href: '/blog' },
    ...(category ? [{ label: category.name, href: `/blog/category/${category.slug}` }] : []),
    { label: post.title, href: `/blog/${post.slug}` },
  ];

  return (
    <main className="min-h-screen bg-cream">
      <SeoHead
        title={post.meta_title || `${post.title} | The Lily Letters Co.`}
        description={post.meta_description || post.excerpt}
        canonical={post.canonical_url || url}
        ogImage={post.og_image || post.hero_image}
        type="article"
        keywords={keywords}
        jsonLd={jsonLd.length === 1 ? jsonLd[0] : jsonLd}
      />

      <header className="pt-28 pb-0">
        <div className="max-w-6xl mx-auto px-6 text-left">
          <Breadcrumbs items={breadcrumbItems} />
          {category && (
            <Link
              to={`/blog/category/${category.slug}`}
              className="inline-block px-3 py-1 bg-wine text-[11px] font-body font-medium tracking-widest uppercase text-cream hover:bg-[#3a1926] transition-colors mb-4"
            >
              {category.name}
            </Link>
          )}
          <motion.h1
            {...fadeUp}
            className="font-display text-4xl md:text-5xl lg:text-[3.25rem] font-light text-wine leading-tight text-balance max-w-4xl"
          >
            {post.title}
          </motion.h1>
          <motion.div
            {...fadeUp}
            transition={{ delay: 0.1 }}
            className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-body text-ink-muted"
          >
            <span className="inline-flex items-center gap-1.5">
              <Clock size={14} strokeWidth={1.5} className="text-gold" />
              {post.reading_time_minutes} min read
            </span>
            <span className="text-ink/25" aria-hidden>
              ·
            </span>
            <span>{post.author_name}</span>
            <span className="text-ink/25" aria-hidden>
              ·
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Calendar size={14} strokeWidth={1.5} className="text-gold" />
              Updated {formattedDate}
            </span>
          </motion.div>
        </div>
        <div className="max-w-6xl mx-auto px-6 mt-8" aria-hidden>
          <div className="h-px w-full bg-taupe/70" />
        </div>
      </header>

      <article className="max-w-6xl mx-auto px-6 pb-20 pt-10">
        <div className="grid lg:grid-cols-[1fr_280px] gap-10 lg:gap-14">
          <div className="min-w-0 text-left">
            {post.direct_answer && (
              <motion.div
                {...fadeUp}
                className="blog-quick-answer bg-white/60 border border-gold/70 p-5 md:p-6 mb-8"
              >
                <p className="text-base font-body text-ink leading-relaxed">
                  <strong className="text-wine font-medium">Quick answer:</strong>{' '}
                  {post.direct_answer}
                </p>
              </motion.div>
            )}

            {preparedContent ? (
              <motion.div
                {...fadeUp}
                transition={{ delay: 0.05 }}
                className="blog-article-body"
                dangerouslySetInnerHTML={{ __html: preparedContent }}
              />
            ) : (
              <p className="font-body text-sm text-ink-subtle">Article content is not available.</p>
            )}

            <BlogFaq faq={post.faq} />

            {post.tags?.length > 0 && (
              <motion.div {...fadeUp} className="mt-8">
                <BlogTagList tags={post.tags} />
              </motion.div>
            )}

            <motion.div {...fadeUp}>
              <BlogAuthorCard
                brandName={post.author_name}
                bio={post.author_bio}
                avatarUrl={post.author_avatar}
              />
            </motion.div>

            <div className="mt-8 pt-6 border-t border-taupe/40">
              <ShareButtons title={post.title} url={url} image={post.hero_image} />
            </div>
            <ShopTheLook products={relatedProducts} />
            <ArticleCta />
          </div>

          <aside className="hidden lg:block min-h-0">
            {preparedContent && <TableOfContents contentHtml={preparedContent} sticky />}
          </aside>
        </div>

        {preparedContent && (
          <div className="lg:hidden mt-10 text-left">
            <TableOfContents contentHtml={preparedContent} />
          </div>
        )}

        {related?.length > 0 && (
          <section className="mt-16 text-left">
            <h2 className="font-display text-3xl text-wine mb-8">Related articles</h2>
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
