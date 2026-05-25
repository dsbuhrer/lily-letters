import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import { getConfig } from './config.js';
import { getSupabase, requireSupabase } from './lib/supabase.js';
import authRoutes from './routes/auth.js';
import postsRoutes from './routes/posts.js';
import adminRoutes from './routes/admin.js';
import productsRoutes, { productAdminRouter } from './routes/products.js';
import subscribersRoutes from './routes/subscribers.js';
import seoRoutes from './routes/seoRoutes.js';
import categoriesRoutes from './routes/categories.js';
import {
  renderBlogIndex,
  renderBlogPost,
  renderCategoryArchive,
} from './ssr/blogHtml.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const config = getConfig();
const app = express();

app.use(
  helmet({
    contentSecurityPolicy: config.isDev ? false : undefined,
    crossOriginEmbedderPolicy: false,
  }),
);
app.use(
  cors({
    origin: config.isDev ? ['http://localhost:5173', 'http://localhost:3001'] : config.siteUrl,
    credentials: true,
  }),
);
app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/posts', postsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin/products', productAdminRouter);
app.use('/api/products', productsRoutes);
app.use('/api/subscribers', subscribersRoutes);
app.use('/api/categories', categoriesRoutes);
app.use(seoRoutes);

async function handleBlogSsr(req, res, next) {
  try {
    const supabase = requireSupabase();
    const { siteUrl } = config;

    if (req.path === '/blog' || req.path === '/blog/') {
      const [{ data: posts }, { data: categories }] = await Promise.all([
        supabase
          .from('posts')
          .select('*, categories(id, slug, name)')
          .eq('status', 'published')
          .order('published_at', { ascending: false })
          .limit(12),
        supabase.from('categories').select('*').order('sort_order'),
      ]);
      return res.send(renderBlogIndex({ posts, categories, siteUrl }));
    }

    const tagMatch = req.path.match(/^\/blog\/tag\/([^/]+)$/);
    if (tagMatch) {
      const slug = tagMatch[1];
      const { data: posts } = await supabase
        .from('posts')
        .select('slug, title, excerpt, published_at')
        .eq('status', 'published')
        .contains('tag_slugs', [slug])
        .order('published_at', { ascending: false });
      const name = slug.replace(/-/g, ' ');
      return res.send(
        renderCategoryArchive({
          category: {
            slug,
            name,
            meta_title: `${name} | Wedding Blog`,
            meta_description: `Articles tagged ${name}.`,
            description: '',
          },
          posts: posts || [],
          siteUrl,
        }),
      );
    }

    const categoryMatch = req.path.match(/^\/blog\/category\/([^/]+)$/);
    if (categoryMatch) {
      const slug = categoryMatch[1];
      const { data: category } = await supabase.from('categories').select('*').eq('slug', slug).single();
      if (!category) return next();
      const { data: posts } = await supabase
        .from('posts')
        .select('slug, title, excerpt, published_at')
        .eq('status', 'published')
        .eq('category_id', category.id)
        .order('published_at', { ascending: false });
      return res.send(renderCategoryArchive({ category, posts, siteUrl }));
    }

    const postMatch = req.path.match(/^\/blog\/([^/]+)$/);
    if (postMatch && postMatch[1] !== 'search' && !postMatch[1].startsWith('tag')) {
      const slug = postMatch[1];
      const { data: post } = await supabase
        .from('posts')
        .select('*, categories(id, slug, name)')
        .eq('slug', slug)
        .eq('status', 'published')
        .single();
      if (!post) return next();

      await supabase.rpc('increment_post_views', { post_id: post.id }).catch(() => {});

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

      return res.send(
        renderBlogPost({
          post,
          category: post.categories,
          related,
          faq: post.faq,
        }),
      );
    }

    next();
  } catch (e) {
    console.error('SSR error:', e.message);
    next();
  }
}

app.get(['/blog', '/blog/', '/blog/category/:slug', '/blog/tag/:slug', '/blog/:slug'], handleBlogSsr);

if (!config.isDev) {
  const dist = path.join(__dirname, '../dist');
  app.use(express.static(dist, { maxAge: '1y', index: false }));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(dist, 'index.html'));
  });
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, supabase: !!getSupabase() });
});

app.listen(config.port, () => {
  console.log(`Server http://localhost:${config.port} (Supabase: ${getSupabase() ? 'on' : 'off'})`);
});
