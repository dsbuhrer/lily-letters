import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, jsonResponse } from '../_shared/cors.ts';

function stripHtml(html: string) {
  return String(html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function fallbackSeo(input: {
  title: string;
  excerpt?: string;
  direct_answer?: string;
  content?: string;
  tag_slugs?: string[];
  regenerate?: boolean;
}) {
  const { title, excerpt, direct_answer, content, tag_slugs, regenerate } = input;
  const plain = stripHtml(content || '').slice(0, 500);
  const baseExcerpt = regenerate
    ? direct_answer?.trim()?.slice(0, 200) || plain.slice(0, 200) || title
    : excerpt?.trim()?.slice(0, 200) ||
      direct_answer?.trim()?.slice(0, 200) ||
      plain.slice(0, 200) ||
      title;
  const metaDescription = (direct_answer?.trim() || plain || baseExcerpt).slice(0, 155).trim();
  const metaTitle = `${title} | The Lily Letters Co.`.slice(0, 60);
  const keywords = Array.isArray(tag_slugs) ? tag_slugs : [];

  return {
    meta_title: metaTitle,
    meta_description: metaDescription,
    excerpt: baseExcerpt.slice(0, 200),
    seo_keywords: keywords.length ? keywords : title.toLowerCase().split(/\s+/).slice(0, 6),
    source: 'fallback',
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return jsonResponse({ error: 'Unauthorized' }, 401);
    }
    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: isAdmin, error: adminError } = await userClient.rpc('is_admin');
    if (adminError || !isAdmin) {
      return jsonResponse({ error: 'Forbidden' }, 403);
    }

    const input = await req.json();
    const title = input.title?.trim();
    if (!title) {
      return jsonResponse({ error: 'Title is required to generate SEO' }, 400);
    }

    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      return jsonResponse(fallbackSeo({ ...input, regenerate: input.regenerate === true }));
    }

    const plainContent = stripHtml(input.content).slice(0, 4000);
    const tag_slugs: string[] = input.tag_slugs || [];
    const regenerate = input.regenerate === true;
    const prompt = `You are an SEO specialist for a US wedding stationery brand (The Lily Letters Co.).
Return ONLY valid JSON with keys: meta_title, meta_description, excerpt, seo_keywords (array).
Write fresh meta_description and excerpt from the article text below — do not reuse placeholder or old copy.
Title: ${title}
Direct answer: ${input.direct_answer || '(none)'}
Tags: ${tag_slugs.join(', ') || '(none)'}
Article text: ${plainContent.slice(0, 2000)}
English only, wedding niche, no markdown.
meta_description: max 155 characters. excerpt: max 200 characters, compelling card teaser.`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json', temperature: 0.4 },
        }),
      },
    );

    const data = await res.json();
    if (!res.ok) {
      return jsonResponse(fallbackSeo({ ...input, regenerate }));
    }

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return jsonResponse(fallbackSeo({ ...input, regenerate }));

    const parsed = JSON.parse(text.replace(/```json\n?|\n?```/g, '').trim());
    const freshExcerpt =
      String(parsed.excerpt || '').trim() ||
      plainContent.slice(0, 200) ||
      String(input.direct_answer || '').slice(0, 200);
    const freshMeta =
      String(parsed.meta_description || '').trim() ||
      String(input.direct_answer || '').slice(0, 155) ||
      plainContent.slice(0, 155);
    return jsonResponse({
      meta_title: String(parsed.meta_title || title).slice(0, 70),
      meta_description: freshMeta.slice(0, 160),
      excerpt: freshExcerpt.slice(0, 220),
      seo_keywords: Array.isArray(parsed.seo_keywords)
        ? parsed.seo_keywords.slice(0, 10)
        : tag_slugs,
      source: 'gemini',
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'SEO generation failed';
    return jsonResponse({ error: message }, 500);
  }
});
