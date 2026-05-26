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
}) {
  const { title, excerpt, direct_answer, content, tag_slugs } = input;
  const plain = stripHtml(content || '').slice(0, 500);
  const baseExcerpt =
    excerpt?.trim() ||
    direct_answer?.trim()?.slice(0, 155) ||
    plain.slice(0, 155) ||
    title;
  const metaDescription = baseExcerpt.slice(0, 155).trim();
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
      return jsonResponse(fallbackSeo(input));
    }

    const plainContent = stripHtml(input.content).slice(0, 4000);
    const tag_slugs: string[] = input.tag_slugs || [];
    const prompt = `You are an SEO specialist for a US wedding stationery brand (The Lily Letters Co.).
Return ONLY valid JSON with keys: meta_title, meta_description, excerpt, seo_keywords (array).
Title: ${title}
Direct answer: ${input.direct_answer || '(none)'}
Excerpt: ${input.excerpt || '(none)'}
Tags: ${tag_slugs.join(', ') || '(none)'}
Text: ${plainContent.slice(0, 1500)}
English only, wedding niche, no markdown.`;

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
      return jsonResponse(fallbackSeo(input));
    }

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return jsonResponse(fallbackSeo(input));

    const parsed = JSON.parse(text.replace(/```json\n?|\n?```/g, '').trim());
    return jsonResponse({
      meta_title: String(parsed.meta_title || title).slice(0, 70),
      meta_description: String(parsed.meta_description || '').slice(0, 160),
      excerpt: String(parsed.excerpt || input.excerpt || '').slice(0, 220),
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
