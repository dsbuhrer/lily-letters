import { slugify } from './utils/slug.js';

/** Human-readable label from slug when no display name exists. */
export function nameFromSlug(slug) {
  return String(slug)
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Canonical display name — keeps user casing when they typed spaces or capitals. */
export function formatTagName(input, slug) {
  const trimmed = String(input).trim();
  if (!trimmed) return nameFromSlug(slug);
  if (/[A-Z]/.test(trimmed) || trimmed.includes(' ')) return trimmed;
  return nameFromSlug(slug);
}

/** Parse a single raw tag value (string slug/name or { slug, name } object). */
function parseTagRaw(raw) {
  if (raw == null) return null;

  if (typeof raw === 'object' && !Array.isArray(raw)) {
    const slugRaw = raw.slug != null ? String(raw.slug).trim() : '';
    const nameRaw = raw.name != null ? String(raw.name).trim() : '';
    const slug = slugify(slugRaw || nameRaw);
    if (!slug) return null;
    const name = nameRaw || formatTagName(slugRaw || nameRaw, slug);
    return { slug, name };
  }

  const trimmed = String(raw).trim();
  if (!trimmed || trimmed === '[object Object]') return null;
  const slug = slugify(trimmed);
  if (!slug) return null;
  return { slug, name: formatTagName(trimmed, slug) };
}

/** Normalize raw tag strings (labels or slugs) into { slug, name } objects. */
export function normalizeTags(rawTags) {
  if (!Array.isArray(rawTags)) return [];
  const seen = new Set();
  const result = [];

  for (const raw of rawTags) {
    const tag = parseTagRaw(raw);
    if (!tag || seen.has(tag.slug)) continue;
    seen.add(tag.slug);
    result.push(tag);
  }

  return result;
}

/** Slugs stored in posts.tag_slugs (canonical for URLs and queries). */
export function tagsToStorageSlugs(tags) {
  return normalizeTags(tags).map((t) => t.slug);
}

export function tagsToKeywords(tags) {
  return normalizeTags(tags).map((t) => t.name);
}

/** Merge tag names with seo_keywords, deduplicated. */
export function mergeSeoKeywords(seoKeywords, tags) {
  const seen = new Set();
  const result = [];
  for (const kw of [...(seoKeywords || []), ...tagsToKeywords(tags)]) {
    const key = String(kw).trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(String(kw).trim());
  }
  return result;
}
