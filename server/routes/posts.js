import { Router } from 'express';
import sanitizeHtml from 'sanitize-html';
import { requireSupabase } from '../lib/supabase.js';

const router = Router();

const sanitizeOptions = {
  allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'h1', 'h2', 'h3', 'figure']),
  allowedAttributes: {
    ...sanitizeHtml.defaults.allowedAttributes,
    img: ['src', 'alt', 'title', 'width', 'height', 'loading'],
    a: ['href', 'name', 'target', 'rel'],
  },
};

function mapPost(row, category) {
  if (!row) return null;
  return { ...row, category: category || null };
}

router.get('/', async (req, res) => {
  try {
    const supabase = requireSupabase();
    const {
      category,
      tag,
      q,
      page = '1',
      sort = 'new',
      limit = '12',
      status = 'published',
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, parseInt(limit, 10) || 12);
    const from = (pageNum - 1) * limitNum;
    const to = from + limitNum - 1;

    let query = supabase
      .from('posts')
      .select('*, categories(id, slug, name)', { count: 'exact' });

    if (status) query = query.eq('status', status);

    if (category) {
      const { data: cat } = await supabase.from('categories').select('id').eq('slug', category).single();
      if (cat) query = query.eq('category_id', cat.id);
    }

    if (tag) query = query.contains('tag_slugs', [tag]);

    if (q) query = query.textSearch('search_vector', q, { type: 'websearch', config: 'english' });

    if (sort === 'popular') query = query.order('view_count', { ascending: false });
    else if (sort === 'trending') query = query.order('featured', { ascending: false }).order('view_count', { ascending: false });
    else query = query.order('published_at', { ascending: false });

    query = query.range(from, to);

    const { data, error, count } = await query;
    if (error) throw error;

    res.json({
      posts: (data || []).map((p) => mapPost(p, p.categories)),
      pagination: { page: pageNum, limit: limitNum, total: count || 0 },
    });
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message });
  }
});

router.get('/:slug', async (req, res) => {
  try {
    const supabase = requireSupabase();
    const { data: post, error } = await supabase
      .from('posts')
      .select('*, categories(id, slug, name)')
      .eq('slug', req.params.slug)
      .eq('status', 'published')
      .single();

    if (error || !post) return res.status(404).json({ error: 'Post not found' });

    try {
      await supabase.from('post_views').insert({ post_id: post.id });
      const { error: rpcErr } = await supabase.rpc('increment_post_views', { post_id: post.id });
      if (rpcErr) {
        await supabase
          .from('posts')
          .update({ view_count: (post.view_count || 0) + 1 })
          .eq('id', post.id);
      }
    } catch (viewErr) {
      console.warn('post view tracking:', viewErr.message);
    }

    let related = [];
    if (post.category_id) {
      const { data: rel } = await supabase
        .from('posts')
        .select('id, slug, title, excerpt, hero_image, published_at, reading_time_minutes')
        .eq('status', 'published')
        .eq('category_id', post.category_id)
        .neq('id', post.id)
        .order('published_at', { ascending: false })
        .limit(4);
      related = rel || [];
    }

    let relatedProducts = [];
    const ids = post.related_product_ids || [];
    if (ids.length) {
      const { data: prods } = await supabase.from('products').select('*').in('id', ids).eq('active', true);
      relatedProducts = prods || [];
    }

    res.json({
      post: mapPost(post, post.categories),
      related,
      relatedProducts,
    });
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message });
  }
});

export { sanitizeOptions };
export default router;
