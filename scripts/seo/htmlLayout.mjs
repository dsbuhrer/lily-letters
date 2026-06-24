import {
  buildMetaTags,
  buildOrganizationJsonLd,
  escapeHtml,
} from './seo.mjs';
import { getAssetTags } from './assets.mjs';

function jsonLdScript(obj) {
  if (!obj) return '';
  return `<script type="application/ld+json">${JSON.stringify(obj)}</script>`;
}

export function renderHtmlPage({
  title,
  description,
  canonical,
  ogImage,
  body,
  jsonLd = [],
  preloadImage,
  ogType = 'article',
  keywords,
}) {
  const assets = getAssetTags();
  const meta = buildMetaTags({
    title,
    description,
    canonical,
    ogImage,
    type: ogType,
    keywords,
  });
  const ld = [buildOrganizationJsonLd(), ...jsonLd].map(jsonLdScript).join('\n');
  const preload = preloadImage
    ? `<link rel="preload" as="image" href="${escapeHtml(preloadImage)}" />`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  ${meta}
  ${preload}
  <link rel="icon" type="image/svg+xml" href="/logo-icon.svg" />
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400;1,500&family=Jost:wght@300;400;500;600&display=swap" rel="stylesheet">
  ${assets.styles}
  <style>
    body{background:#f4f0e7;color:#2d2020;font-family:Jost,sans-serif}
    .section-heading{font-family:"Cormorant Garamond",Georgia,serif;font-size:2.25rem;font-weight:300;color:#4c2233}
    .section-subtitle{font-size:.75rem;letter-spacing:.2em;text-transform:uppercase;color:#978152}
    .prose-blog h2{font-family:"Cormorant Garamond",serif;font-size:1.5rem;color:#4c2233;margin-top:2rem}
    .prose-blog h3{font-family:"Cormorant Garamond",serif;font-size:1.25rem;color:#4c2233;margin-top:1.5rem}
    .prose-blog ul{list-style:disc;padding-left:1.25rem}
    .prose-blog img{max-width:100%;height:auto}
  </style>
  ${ld}
</head>
<body>
  <div id="root">${body}</div>
  ${assets.scripts}
</body>
</html>`;
}
