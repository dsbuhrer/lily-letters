import {
  buildArticleJsonLd,
  buildFaqJsonLd,
  buildBreadcrumbJsonLd,
  escapeHtml,
} from './seo.mjs';
import { getSiteUrl } from './config.mjs';
import { renderHtmlPage } from './htmlLayout.mjs';

export function renderBlogIndex({ posts, categories }) {
  const siteUrl = getSiteUrl();
  const title = 'Wedding Inspiration & Planning Blog | The Lily Letters Co.';
  const description =
    'Expert guides on wedding invitations, custom signage, color palettes, and printable stationery. Inspiration for sophisticated, personalized weddings.';

  const listHtml = (posts || [])
    .slice(0, 12)
    .map(
      (p) => `
    <article class="border-b border-taupe/40 py-8">
      <a href="/blog/${escapeHtml(p.slug)}" class="block group">
        ${p.hero_image ? `<img src="${escapeHtml(p.hero_image)}" alt="${escapeHtml(p.hero_alt || p.title)}" loading="lazy" width="800" height="450" class="w-full aspect-[16/9] object-cover mb-4" />` : ''}
        <p class="text-xs uppercase tracking-widest text-gold mb-2">${escapeHtml(p.categories?.name || 'Blog')}</p>
        <h2 class="font-display text-2xl text-wine group-hover:underline">${escapeHtml(p.title)}</h2>
        <p class="mt-2 text-sm text-[#2d2020]/70">${escapeHtml(p.excerpt || '')}</p>
      </a>
    </article>`,
    )
    .join('');

  const body = `
    <main class="min-h-screen bg-cream pt-28 pb-16">
      <div class="max-w-3xl mx-auto px-6">
        <header class="mb-12 text-center">
          <p class="section-subtitle mb-3">The Blog</p>
          <h1 class="section-heading">Wedding Inspiration & Expert Guides</h1>
          <p class="mt-4 font-body text-[#2d2020]/70 max-w-xl mx-auto">${escapeHtml(description)}</p>
        </header>
        <nav aria-label="Categories" class="flex flex-wrap gap-2 justify-center mb-10">
          ${(categories || []).map((c) => `<a href="/blog/category/${escapeHtml(c.slug)}" class="px-3 py-1 border border-taupe text-sm text-wine hover:bg-wine hover:text-cream transition-colors">${escapeHtml(c.name)}</a>`).join('')}
        </nav>
        <section>${listHtml || '<p>No articles yet.</p>'}</section>
      </div>
    </main>`;

  return renderHtmlPage({
    title,
    description,
    canonical: `${siteUrl}/blog`,
    body,
    jsonLd: [
      buildBreadcrumbJsonLd([
        { name: 'Home', href: '/' },
        { name: 'Blog', href: '/blog' },
      ]),
    ],
  });
}

export function renderBlogPost({ post, category, related, relatedProducts = [], faq }) {
  const siteUrl = getSiteUrl();
  const canonical = post.canonical_url || `${siteUrl}/blog/${post.slug}`;
  const title = post.meta_title || `${post.title} | The Lily Letters Co.`;
  const description = post.meta_description || post.excerpt || '';

  const faqHtml = (faq || [])
    .map(
      (f) => `
    <details class="border-b border-taupe/30 py-4 group">
      <summary class="font-display text-lg text-wine cursor-pointer list-none flex justify-between items-center">
        ${escapeHtml(f.question)}
        <span class="text-gold text-xl">+</span>
      </summary>
      <p class="mt-3 font-body text-sm text-[#2d2020]/80 leading-relaxed">${escapeHtml(f.answer)}</p>
    </details>`,
    )
    .join('');

  const relatedHtml = (related || [])
    .map(
      (r) => `
    <li><a href="/blog/${escapeHtml(r.slug)}" class="text-wine hover:underline font-body text-sm">${escapeHtml(r.title)}</a></li>`,
    )
    .join('');

  const shopHtml = (relatedProducts || [])
    .map(
      (p) => `
    <a href="/products/${escapeHtml(p.slug || p.id)}" class="block border border-taupe/50 p-4 hover:border-wine transition-colors">
      ${p.images?.[0] ? `<img src="${escapeHtml(p.images[0])}" alt="${escapeHtml(p.name)}" width="400" height="300" class="w-full aspect-[4/3] object-cover mb-3" loading="lazy" />` : ''}
      <p class="font-display text-lg text-wine">${escapeHtml(p.name)}</p>
      <p class="text-sm text-[#2d2020]/60 mt-1">$${Number(p.price).toFixed(2)}</p>
    </a>`,
    )
    .join('');

  const body = `
    <main class="min-h-screen bg-cream pt-28 pb-16">
      <article class="max-w-3xl mx-auto px-6" itemscope itemtype="https://schema.org/Article">
        <nav aria-label="Breadcrumb" class="text-xs uppercase tracking-widest text-[#2d2020]/50 mb-6">
          <a href="/" class="hover:text-wine">Home</a> / <a href="/blog" class="hover:text-wine">Blog</a> / <span class="text-wine">${escapeHtml(category?.name || 'Article')}</span>
        </nav>
        ${post.hero_image ? `<img src="${escapeHtml(post.hero_image)}" alt="${escapeHtml(post.hero_alt || post.title)}" width="1200" height="675" class="w-full aspect-[16/9] object-cover mb-8" itemprop="image" />` : ''}
        <header class="mb-8">
          <p class="section-subtitle mb-2">${escapeHtml(category?.name || 'Wedding Inspiration')}</p>
          <h1 class="section-heading" itemprop="headline">${escapeHtml(post.title)}</h1>
          <p class="mt-4 font-body text-sm text-[#2d2020]/60">${post.reading_time_minutes || 5} min read · Updated ${new Date(post.updated_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
        </header>
        ${post.direct_answer ? `<p class="text-lg font-body text-[#2d2020] leading-relaxed border-l-2 border-gold pl-4 mb-8" itemprop="description"><strong>Quick answer:</strong> ${escapeHtml(post.direct_answer)}</p>` : ''}
        <div class="prose-blog font-body text-[#2d2020] leading-relaxed space-y-4" itemprop="articleBody">${post.content}</div>
        ${faq?.length ? `<section class="mt-12" aria-labelledby="faq-heading"><h2 id="faq-heading" class="font-display text-2xl text-wine mb-4">Frequently Asked Questions</h2>${faqHtml}</section>` : ''}
        ${shopHtml ? `<section class="mt-12"><h2 class="font-display text-2xl text-wine mb-2">Shop the look</h2><p class="font-body text-sm text-[#2d2020]/60 mb-6">Editable Canva templates to match this inspiration.</p><div class="grid grid-cols-1 sm:grid-cols-2 gap-6">${shopHtml}</div></section>` : ''}
        <section class="mt-12 p-8 bg-wine text-cream text-center">
          <h2 class="font-display text-2xl mb-2">Shop Wedding Templates</h2>
          <p class="text-sm text-cream/80 mb-4">Editable in Canva — download instantly after purchase.</p>
          <a href="/products" class="inline-block bg-gold text-cream px-8 py-3 text-xs uppercase tracking-widest">Browse Templates</a>
        </section>
        ${related?.length ? `<aside class="mt-10"><h2 class="font-display text-xl text-wine mb-3">Related Articles</h2><ul class="space-y-2">${relatedHtml}</ul></aside>` : ''}
      </article>
    </main>`;

  const jsonLd = [
    buildArticleJsonLd(post, category),
    buildFaqJsonLd(faq),
    buildBreadcrumbJsonLd([
      { name: 'Home', href: '/' },
      { name: 'Blog', href: '/blog' },
      { name: post.title, href: `/blog/${post.slug}` },
    ]),
  ].filter(Boolean);

  return renderHtmlPage({
    title,
    description,
    canonical,
    ogImage: post.og_image || post.hero_image,
    body,
    jsonLd,
    preloadImage: post.hero_image,
  });
}

export function renderCategoryArchive({ category, posts }) {
  const siteUrl = getSiteUrl();
  const title = category.meta_title || `${category.name} | Wedding Blog`;
  const description = category.meta_description || category.description || '';

  const listHtml = (posts || [])
    .map(
      (p) => `
    <article class="py-6 border-b border-taupe/30">
      <a href="/blog/${escapeHtml(p.slug)}"><h2 class="font-display text-xl text-wine">${escapeHtml(p.title)}</h2></a>
      <p class="text-sm mt-1 text-[#2d2020]/70">${escapeHtml(p.excerpt || '')}</p>
    </article>`,
    )
    .join('');

  const body = `
    <main class="min-h-screen bg-cream pt-28 pb-16">
      <div class="max-w-3xl mx-auto px-6">
        <h1 class="section-heading mb-4">${escapeHtml(category.name)}</h1>
        <p class="font-body text-[#2d2020]/70 mb-10">${escapeHtml(description)}</p>
        ${listHtml}
      </div>
    </main>`;

  return renderHtmlPage({
    title,
    description,
    canonical: `${siteUrl}/blog/category/${category.slug}`,
    body,
  });
}

export function renderTagArchive({ tagSlug, posts }) {
  const siteUrl = getSiteUrl();
  const name = tagSlug.replace(/-/g, ' ');
  const title = `${name} | Wedding Blog`;
  const description = `Articles tagged ${name}.`;

  const listHtml = (posts || [])
    .map(
      (p) => `
    <article class="py-6 border-b border-taupe/30">
      <a href="/blog/${escapeHtml(p.slug)}"><h2 class="font-display text-xl text-wine">${escapeHtml(p.title)}</h2></a>
      <p class="text-sm mt-1 text-[#2d2020]/70">${escapeHtml(p.excerpt || '')}</p>
    </article>`,
    )
    .join('');

  const body = `
    <main class="min-h-screen bg-cream pt-28 pb-16">
      <div class="max-w-3xl mx-auto px-6">
        <h1 class="section-heading mb-4 capitalize">${escapeHtml(name)}</h1>
        <p class="font-body text-[#2d2020]/70 mb-10">${escapeHtml(description)}</p>
        ${listHtml}
      </div>
    </main>`;

  return renderHtmlPage({
    title,
    description,
    canonical: `${siteUrl}/blog/tag/${tagSlug}`,
    body,
  });
}
