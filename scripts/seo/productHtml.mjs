import { buildProductJsonLd, buildBreadcrumbJsonLd, escapeHtml } from './seo.mjs';
import { getSiteUrl } from './config.mjs';
import { renderHtmlPage } from './htmlLayout.mjs';

export function renderProductPage(product) {
  const siteUrl = getSiteUrl();
  const title = `${product.name} | The Lily Letters Co.`;
  const description =
    product.description?.slice(0, 155) ||
    product.subtitle ||
    `Editable wedding template — ${product.name}. Instant Canva download.`;
  const canonical = `${siteUrl}/products/${product.slug}`;
  const image = product.images?.[0];

  const body = `
    <main class="min-h-screen bg-cream pt-28 pb-16">
      <article class="max-w-4xl mx-auto px-6" itemscope itemtype="https://schema.org/Product">
        <nav aria-label="Breadcrumb" class="text-xs uppercase tracking-widest text-[#2d2020]/50 mb-6">
          <a href="/">Home</a> / <a href="/products">Shop</a> / <span class="text-wine">${escapeHtml(product.name)}</span>
        </nav>
        ${image ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(product.name)}" width="1200" height="800" class="w-full max-h-[480px] object-cover mb-8" itemprop="image" />` : ''}
        <h1 class="section-heading" itemprop="name">${escapeHtml(product.name)}</h1>
        ${product.subtitle ? `<p class="mt-2 text-lg text-[#2d2020]/80" itemprop="description">${escapeHtml(product.subtitle)}</p>` : ''}
        <p class="mt-4 font-display text-2xl text-wine" itemprop="offers" itemscope itemtype="https://schema.org/Offer">
          <span itemprop="price" content="${Number(product.price)}">$${Number(product.price).toFixed(2)}</span>
          <meta itemprop="priceCurrency" content="USD" />
        </p>
        ${product.description ? `<div class="mt-6 font-body text-[#2d2020]/80 leading-relaxed whitespace-pre-wrap">${escapeHtml(product.description)}</div>` : ''}
        <p class="mt-8"><a href="/products/${escapeHtml(product.slug)}" class="inline-block bg-wine text-cream px-8 py-3 text-xs uppercase tracking-widest">View in shop</a></p>
      </article>
    </main>`;

  return renderHtmlPage({
    title,
    description,
    canonical,
    ogImage: image,
    ogType: 'product',
    body,
    jsonLd: [
      buildProductJsonLd(product),
      buildBreadcrumbJsonLd([
        { name: 'Home', href: '/' },
        { name: 'Shop', href: '/products' },
        { name: product.name, href: `/products/${product.slug}` },
      ]),
    ],
    preloadImage: image,
  });
}
