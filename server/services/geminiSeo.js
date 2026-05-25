import { getConfig } from '../config.js';

function stripHtml(html) {
  return String(html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function fallbackSeo({ title, excerpt, direct_answer, content, tag_slugs }) {
  const plain = stripHtml(content).slice(0, 500);
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

export async function generatePostSeo(input) {
  const { title, excerpt, direct_answer, content, tag_slugs = [] } = input;
  if (!title?.trim()) {
    const err = new Error('Title is required to generate SEO');
    err.status = 400;
    throw err;
  }

  const { geminiApiKey } = getConfig();
  if (!geminiApiKey) {
    return fallbackSeo(input);
  }

  const plainContent = stripHtml(content).slice(0, 4000);
  const prompt = `You are an SEO specialist for a US wedding stationery brand (The Lily Letters Co.).
Given this blog post data, return ONLY valid JSON with these keys:
- meta_title (max 60 chars, include brand only if natural)
- meta_description (max 155 chars, compelling for Google)
- excerpt (1-2 sentences, max 200 chars, for blog cards)
- seo_keywords (array of 5-8 lowercase keyword strings)

Title: ${title}
Direct answer (AEO): ${direct_answer || '(none)'}
Current excerpt: ${excerpt || '(none)'}
Tags: ${tag_slugs.join(', ') || '(none)'}
Article text (excerpt): ${plainContent.slice(0, 1500)}

Rules: English only, wedding niche, no markdown, no extra keys.`;

  try {
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
      console.warn('Gemini SEO error:', data?.error?.message || res.status);
      return fallbackSeo(input);
    }

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return fallbackSeo(input);

    const parsed = JSON.parse(text.replace(/```json\n?|\n?```/g, '').trim());
    return {
      meta_title: String(parsed.meta_title || title).slice(0, 70),
      meta_description: String(parsed.meta_description || '').slice(0, 160),
      excerpt: String(parsed.excerpt || excerpt || '').slice(0, 220),
      seo_keywords: Array.isArray(parsed.seo_keywords) ? parsed.seo_keywords.slice(0, 10) : tag_slugs,
      source: 'gemini',
    };
  } catch (e) {
    console.warn('Gemini SEO failed:', e.message);
    return fallbackSeo(input);
  }
}
