import { Helmet } from 'react-helmet-async';

export default function SeoHead({
  title = 'The Lily Letters Co.',
  description = 'Beautifully crafted wedding stationery & printable templates.',
  canonical,
  ogImage,
  type = 'website',
  keywords,
  jsonLd,
}) {
  const siteUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const url = canonical || (typeof window !== 'undefined' ? window.location.href : siteUrl);
  const image = ogImage || `${siteUrl}/logos/logo-horizontal.svg`;
  const keywordsStr = Array.isArray(keywords) ? keywords.join(', ') : keywords;

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      {keywordsStr && <meta name="keywords" content={keywordsStr} />}
      {canonical && <link rel="canonical" href={canonical} />}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={image} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      {jsonLd && (
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      )}
    </Helmet>
  );
}
