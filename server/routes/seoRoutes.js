import { Router } from 'express';
import { requireSupabase, getSupabase } from '../lib/supabase.js';
import { generateSitemap, generateRss, generateLlmsTxt } from '../services/seo.js';
import { getConfig } from '../config.js';

const router = Router();

router.get('/robots.txt', (_req, res) => {
  const { siteUrl } = getConfig();
  res.type('text/plain').send(`User-agent: *
Allow: /
Disallow: /admin
Disallow: /checkout
Disallow: /order-confirmation

User-agent: GPTBot
Allow: /blog/

User-agent: Google-Extended
Allow: /

Sitemap: ${siteUrl}/sitemap.xml
`);
});

router.get('/sitemap.xml', async (_req, res) => {
  try {
    const xml = await generateSitemap(requireSupabase());
    res.type('application/xml').send(xml);
  } catch (e) {
    res.status(503).send('Sitemap unavailable');
  }
});

router.get('/rss.xml', async (_req, res) => {
  try {
    const xml = await generateRss(requireSupabase());
    res.type('application/xml').send(xml);
  } catch (e) {
    res.status(503).send('RSS unavailable');
  }
});

router.get('/llms.txt', async (_req, res) => {
  try {
    const sb = getSupabase();
    if (!sb) {
      return res.type('text/plain').send('# The Lily Letters Co.\nConfigure Supabase for dynamic llms.txt\n');
    }
    const txt = await generateLlmsTxt(sb);
    res.type('text/plain').send(txt);
  } catch (e) {
    res.status(503).send('llms.txt unavailable');
  }
});

export default router;
