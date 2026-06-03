import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { setSiteUrl } from './seo/config.mjs';
import {
  generateSitemap,
  generateRss,
  generateLlmsTxt,
  generateRobotsTxt,
} from './seo/seo.mjs';
import {
  renderBlogIndex,
  renderBlogPost,
  renderCategoryArchive,
  renderTagArchive,
} from './seo/blogHtml.mjs';
import { renderProductPage } from './seo/productHtml.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const dist = path.join(root, 'dist');

config({ path: path.join(root, '.env') });

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const siteUrl = (process.env.SITE_URL || process.env.VITE_SITE_URL || 'https://thelilyletters.co').replace(
  /\/$/,
  '',
);

function writeFile(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, 'utf8');
}

async function main() {
  if (!fs.existsSync(path.join(dist, 'index.html'))) {
    console.error('Run vite build first (dist/index.html missing).');
    process.exit(1);
  }

  setSiteUrl(siteUrl);

  if (!supabaseUrl || !serviceKey) {
    console.warn('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY — skipping dynamic prerender.');
    writeFile(path.join(dist, 'robots.txt'), generateRobotsTxt());
    return;
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  writeFile(path.join(dist, 'sitemap.xml'), await generateSitemap(supabase));
  writeFile(path.join(dist, 'rss.xml'), await generateRss(supabase));
  writeFile(path.join(dist, 'llms.txt'), await generateLlmsTxt(supabase));
  writeFile(path.join(dist, 'robots.txt'), generateRobotsTxt());

  const [{ data: posts }, { data: categories }, { data: products }] = await Promise.all([
    supabase
      .from('posts')
      .select('*, categories(id, slug, name)')
      .eq('status', 'published')
      .order('published_at', { ascending: false }),
    supabase.from('categories').select('*').is('deleted_at', null).order('sort_order'),
    supabase.from('products').select('*').eq('active', true).order('id'),
  ]);

  writeFile(
    path.join(dist, 'blog', 'index.html'),
    renderBlogIndex({ posts: posts || [], categories: categories || [] }),
  );

  const tagSlugs = new Set();
  for (const post of posts || []) {
    (post.tag_slugs || []).forEach((t) => tagSlugs.add(t));
  }

  for (const category of categories || []) {
    const { data: catPosts } = await supabase
      .from('posts')
      .select('slug, title, excerpt, published_at')
      .eq('status', 'published')
      .eq('category_id', category.id)
      .order('published_at', { ascending: false });
    writeFile(
      path.join(dist, 'blog', 'category', category.slug, 'index.html'),
      renderCategoryArchive({ category, posts: catPosts || [] }),
    );
  }

  for (const tagSlug of tagSlugs) {
    const { data: tagPosts } = await supabase
      .from('posts')
      .select('slug, title, excerpt, published_at')
      .eq('status', 'published')
      .contains('tag_slugs', [tagSlug])
      .order('published_at', { ascending: false });
    writeFile(
      path.join(dist, 'blog', 'tag', tagSlug, 'index.html'),
      renderTagArchive({ tagSlug, posts: tagPosts || [] }),
    );
  }

  for (const post of posts || []) {
    let related = [];
    if (post.category_id) {
      const { data: rel } = await supabase
        .from('posts')
        .select('slug, title')
        .eq('status', 'published')
        .eq('category_id', post.category_id)
        .neq('id', post.id)
        .limit(4);
      related = rel || [];
    }

    let relatedProducts = [];
    const productIds = Array.isArray(post.related_product_ids) ? post.related_product_ids : [];
    if (productIds.length) {
      const { data: prods } = await supabase
        .from('products')
        .select('id, slug, name, subtitle, price, original_price, images, badge, category, rating, reviews')
        .in('id', productIds)
        .eq('active', true);
      relatedProducts = prods || [];
    }

    writeFile(
      path.join(dist, 'blog', post.slug, 'index.html'),
      renderBlogPost({
        post,
        category: post.categories,
        related,
        relatedProducts,
        faq: post.faq,
      }),
    );
  }

  for (const product of products || []) {
    writeFile(
      path.join(dist, 'products', product.slug, 'index.html'),
      renderProductPage(product),
    );
  }

  const htaccessSrc = path.join(root, 'public', '.htaccess');
  if (fs.existsSync(htaccessSrc)) {
    fs.copyFileSync(htaccessSrc, path.join(dist, '.htaccess'));
  }

  console.log(`Prerender complete → ${dist}`);
  console.log(`  Posts: ${(posts || []).length}, Products: ${(products || []).length}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
