import { getSiteUrl } from './config.mjs';

const ORG = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'The Lily Letters Co.',
  sameAs: ['https://www.instagram.com/thelilyletters.co'],
  description:
    'Beautifully crafted wedding stationery and printable templates. Editable in Canva — personalize, download, and print instantly.',
};

export function buildOrganizationJsonLd() {
  const siteUrl = getSiteUrl();
  return { ...ORG, url: siteUrl, logo: `${siteUrl}/logos/logo-primary.svg` };
}

export function buildArticleJsonLd(post, category) {
  const siteUrl = getSiteUrl();
  const url = `${siteUrl}/blog/${post.slug}`;
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.meta_description || post.excerpt,
    image: post.og_image || post.hero_image,
    datePublished: post.published_at,
    dateModified: post.updated_at,
    author: { '@type': 'Person', name: post.author_name || 'The Lily Letters Co.' },
    publisher: {
      '@type': 'Organization',
      name: 'The Lily Letters Co.',
      logo: { '@type': 'ImageObject', url: `${siteUrl}/logos/logo-primary.svg` },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    articleSection: category?.name,
    keywords: (post.seo_keywords || []).join(', '),
  };
}

export function buildProductJsonLd(product) {
  const siteUrl = getSiteUrl();
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description || product.subtitle,
    image: product.images?.[0],
    offers: {
      '@type': 'Offer',
      price: Number(product.price),
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
      url: `${siteUrl}/products/${product.slug}`,
    },
  };
}

export function buildFaqJsonLd(faq) {
  if (!faq?.length) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  };
}

export function buildBreadcrumbJsonLd(items) {
  const siteUrl = getSiteUrl();
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.href.startsWith('http') ? item.href : `${siteUrl}${item.href}`,
    })),
  };
}

export function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function buildMetaTags({ title, description, canonical, ogImage, type = 'website' }) {
  const siteUrl = getSiteUrl();
  const url = canonical || siteUrl;
  const img = ogImage || `${siteUrl}/logos/logo-horizontal.svg`;
  const t = escapeHtml(title);
  const d = escapeHtml(description);

  return `
    <title>${t}</title>
    <meta name="description" content="${d}" />
    <link rel="canonical" href="${escapeHtml(url)}" />
    <meta property="og:type" content="${type}" />
    <meta property="og:title" content="${t}" />
    <meta property="og:description" content="${d}" />
    <meta property="og:url" content="${escapeHtml(url)}" />
    <meta property="og:image" content="${escapeHtml(img)}" />
    <meta property="og:site_name" content="The Lily Letters Co." />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${t}" />
    <meta name="twitter:description" content="${d}" />
    <meta name="twitter:image" content="${escapeHtml(img)}" />
  `.trim();
}

export async function generateSitemap(supabase) {
  const siteUrl = getSiteUrl();
  const urls = [
    { loc: siteUrl, priority: '1.0' },
    { loc: `${siteUrl}/products`, priority: '0.9' },
    { loc: `${siteUrl}/blog`, priority: '0.9' },
    { loc: `${siteUrl}/about`, priority: '0.6' },
    { loc: `${siteUrl}/faq`, priority: '0.6' },
    { loc: `${siteUrl}/contact`, priority: '0.5' },
  ];

  const [{ data: posts }, { data: categories }, { data: products }] = await Promise.all([
    supabase.from('posts').select('slug, updated_at').eq('status', 'published'),
    supabase.from('categories').select('slug').is('deleted_at', null),
    supabase.from('products').select('slug, updated_at').eq('active', true),
  ]);

  posts?.forEach((p) =>
    urls.push({ loc: `${siteUrl}/blog/${p.slug}`, lastmod: p.updated_at, priority: '0.8' }),
  );
  categories?.forEach((c) =>
    urls.push({ loc: `${siteUrl}/blog/category/${c.slug}`, priority: '0.7' }),
  );
  products?.forEach((p) =>
    urls.push({ loc: `${siteUrl}/products/${p.slug}`, lastmod: p.updated_at, priority: '0.7' }),
  );

  const entries = urls
    .map((u) => {
      const lastmod = u.lastmod
        ? `<lastmod>${new Date(u.lastmod).toISOString().split('T')[0]}</lastmod>`
        : '';
      return `  <url><loc>${escapeHtml(u.loc)}</loc>${lastmod}<priority>${u.priority || '0.5'}</priority></url>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</urlset>`;
}

export async function generateRss(supabase) {
  const siteUrl = getSiteUrl();
  const { data: posts } = await supabase
    .from('posts')
    .select('slug, title, excerpt, published_at, hero_image')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(50);

  const items = (posts || [])
    .map(
      (p) => `
    <item>
      <title>${escapeHtml(p.title)}</title>
      <link>${siteUrl}/blog/${p.slug}</link>
      <guid>${siteUrl}/blog/${p.slug}</guid>
      <pubDate>${new Date(p.published_at).toUTCString()}</pubDate>
      <description>${escapeHtml(p.excerpt || '')}</description>
      ${p.hero_image ? `<enclosure url="${escapeHtml(p.hero_image)}" type="image/jpeg"/>` : ''}
    </item>`,
    )
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>The Lily Letters Co. Blog</title>
    <link>${siteUrl}/blog</link>
    <description>Wedding stationery inspiration, planning tips, and custom print guides.</description>
    <language>en-us</language>
    ${items}
  </channel>
</rss>`;
}

export async function generateLlmsTxt(supabase) {
  const siteUrl = getSiteUrl();
  const { data: posts } = await supabase
    .from('posts')
    .select('slug, title, excerpt')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(30);

  const lines = [
    '# The Lily Letters Co.',
    '',
    '> Premium wedding stationery, personalized wedding details, custom signage, and wedding printables.',
    '',
    '## Primary pages',
    `- Home: ${siteUrl}/`,
    `- Shop: ${siteUrl}/products`,
    `- Blog: ${siteUrl}/blog`,
    `- FAQ: ${siteUrl}/faq`,
    '',
    '## Blog articles (citation-friendly)',
  ];

  (posts || []).forEach((p) => {
    lines.push(`- ${p.title}: ${siteUrl}/blog/${p.slug}`);
    if (p.excerpt) lines.push(`  Summary: ${p.excerpt}`);
  });

  lines.push(
    '',
    '## Contact',
    '- Email: thelilyletters.co@gmail.com',
    '- Instagram: https://www.instagram.com/thelilyletters.co',
  );
  return lines.join('\n');
}

export function generateRobotsTxt() {
  const siteUrl = getSiteUrl();
  return `User-agent: *
Allow: /
Disallow: /admin
Disallow: /checkout
Disallow: /order-confirmation
Disallow: /account

User-agent: GPTBot
Allow: /blog/

User-agent: Google-Extended
Allow: /

Sitemap: ${siteUrl}/sitemap.xml
`;
}
