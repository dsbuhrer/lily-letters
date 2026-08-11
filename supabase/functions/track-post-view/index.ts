import { corsHeaders, jsonResponse } from '../_shared/cors.ts';
import { getServiceSupabase } from '../_shared/orders.ts';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000;
const RATE_LIMIT_MAX = 8;

function clientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }
  return (
    req.headers.get('x-real-ip') ||
    req.headers.get('cf-connecting-ip') ||
    'unknown'
  );
}

function countryFromHeaders(req: Request): { code: string | null; name: string | null } {
  const code = (
    req.headers.get('cf-ipcountry') ||
    req.headers.get('x-vercel-ip-country') ||
    req.headers.get('x-country-code') ||
    ''
  )
    .trim()
    .toUpperCase();
  if (!code || code === 'XX' || code === 'T1') {
    return { code: null, name: null };
  }
  return { code: code.slice(0, 2), name: null };
}

function detectDevice(ua: string): 'desktop' | 'mobile' | 'tablet' | 'unknown' {
  if (!ua) return 'unknown';
  const s = ua.toLowerCase();
  if (/ipad|tablet|kindle|silk|playbook|(android(?!.*mobile))/.test(s)) return 'tablet';
  if (/mobi|iphone|ipod|android.*mobile|windows phone|opera mini|opera mobi/.test(s)) {
    return 'mobile';
  }
  if (/mozilla|chrome|safari|firefox|edge|opera|msie|trident/.test(s)) return 'desktop';
  return 'unknown';
}

async function sha256Hex(value: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function lookupCountry(ip: string): Promise<{ code: string | null; name: string | null }> {
  if (!ip || ip === 'unknown' || ip === '127.0.0.1' || ip.startsWith('10.') || ip.startsWith('192.168.')) {
    return { code: null, name: null };
  }
  try {
    const res = await fetch(`https://ipwho.is/${encodeURIComponent(ip)}`, {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return { code: null, name: null };
    const data = await res.json();
    if (!data?.success) return { code: null, name: null };
    const code = typeof data.country_code === 'string' ? data.country_code.toUpperCase().slice(0, 2) : null;
    const name = typeof data.country === 'string' ? data.country.slice(0, 100) : null;
    return { code, name };
  } catch {
    return { code: null, name: null };
  }
}

function startOfUtcDayIso(): string {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  try {
    const body = await req.json().catch(() => ({}));
    const postId = String(body.post_id || '').trim();
    if (!UUID_RE.test(postId)) {
      return jsonResponse({ error: 'Invalid post_id' }, 400);
    }

    const referrerRaw = typeof body.referrer === 'string' ? body.referrer.trim() : '';
    const referrer = referrerRaw ? referrerRaw.slice(0, 500) : null;

    const ua = req.headers.get('user-agent') || '';
    const deviceType = detectDevice(ua);
    const ip = clientIp(req);
    const day = new Date().toISOString().slice(0, 10);
    const visitorHash = await sha256Hex(`${ip}|${ua}|${day}`);

    const supabase = getServiceSupabase();

    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('id, status')
      .eq('id', postId)
      .maybeSingle();

    if (postError) throw postError;
    if (!post || post.status !== 'published') {
      return jsonResponse({ error: 'Post not found' }, 404);
    }

    const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();
    const { count: recentCount, error: rateError } = await supabase
      .from('post_views')
      .select('id', { count: 'exact', head: true })
      .eq('visitor_hash', visitorHash)
      .gte('viewed_at', windowStart);

    if (rateError) throw rateError;
    if ((recentCount || 0) >= RATE_LIMIT_MAX) {
      return jsonResponse({ ok: true, limited: true });
    }

    let geo = countryFromHeaders(req);
    if (!geo.code) {
      geo = await lookupCountry(ip);
    }

    const { count: todayCount, error: todayError } = await supabase
      .from('post_views')
      .select('id', { count: 'exact', head: true })
      .eq('post_id', postId)
      .eq('visitor_hash', visitorHash)
      .gte('viewed_at', startOfUtcDayIso());

    if (todayError) throw todayError;
    const isNewDailyVisitor = (todayCount || 0) === 0;

    const { error: insertError } = await supabase.from('post_views').insert({
      post_id: postId,
      device_type: deviceType,
      country_code: geo.code,
      country_name: geo.name,
      referrer,
      visitor_hash: visitorHash,
    });

    if (insertError) throw insertError;

    if (isNewDailyVisitor) {
      const { data: current } = await supabase
        .from('posts')
        .select('view_count')
        .eq('id', postId)
        .maybeSingle();
      const next = (current?.view_count || 0) + 1;
      const { error: updateError } = await supabase
        .from('posts')
        .update({ view_count: next })
        .eq('id', postId)
        .eq('status', 'published');
      if (updateError) throw updateError;
    }

    return jsonResponse({ ok: true, counted: isNewDailyVisitor });
  } catch (err) {
    console.error('track-post-view', err);
    return jsonResponse(
      { error: err instanceof Error ? err.message : 'Could not track view.' },
      500,
    );
  }
});
