import { corsHeaders, jsonResponse } from '../_shared/cors.ts';

const GITHUB_API = 'https://api.github.com';

type WebhookPayload = {
  type?: string;
  table?: string;
  record?: { status?: string; slug?: string };
  old_record?: { status?: string; slug?: string };
};

function shouldRebuild(payload: WebhookPayload): { ok: boolean; reason?: string } {
  if (payload.table && payload.table !== 'posts') {
    return { ok: false, reason: 'ignored_table' };
  }

  const record = payload.record;
  const old = payload.old_record;
  const eventType = payload.type || 'UNKNOWN';

  if (eventType === 'DELETE') {
    if (old?.status === 'published') {
      return { ok: true, reason: 'published_post_deleted' };
    }
    return { ok: false, reason: 'draft_deleted' };
  }

  if (record?.status === 'published') {
    if (eventType === 'INSERT') {
      return { ok: true, reason: 'published_insert' };
    }
    if (eventType === 'UPDATE') {
      return { ok: true, reason: 'published_update' };
    }
  }

  return { ok: false, reason: 'not_published_change' };
}

async function dispatchGitHubRebuild(reason: string, slug?: string) {
  const token = Deno.env.get('GH_DISPATCH_TOKEN');
  const owner = Deno.env.get('GITHUB_OWNER') || 'dsbuhrer';
  const repo = Deno.env.get('GITHUB_REPO') || 'lily-letters';
  const eventType = Deno.env.get('GITHUB_DISPATCH_EVENT') || 'rebuild-seo';

  if (!token) {
    throw new Error('GH_DISPATCH_TOKEN is not configured');
  }

  const res = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/dispatches`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      event_type: eventType,
      client_payload: { reason, slug: slug || null, triggered_at: new Date().toISOString() },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub dispatch failed (${res.status}): ${text}`);
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const webhookSecret = Deno.env.get('WEBHOOK_SECRET');
  if (webhookSecret) {
    const header = req.headers.get('x-webhook-secret');
    if (header !== webhookSecret) {
      return jsonResponse({ error: 'Unauthorized' }, 401);
    }
  }

  try {
    const payload = (await req.json()) as WebhookPayload;
    const decision = shouldRebuild(payload);

    if (!decision.ok) {
      return jsonResponse({ ok: true, skipped: true, reason: decision.reason });
    }

    await dispatchGitHubRebuild(decision.reason!, payload.record?.slug || payload.old_record?.slug);

    return jsonResponse({
      ok: true,
      dispatched: true,
      reason: decision.reason,
      slug: payload.record?.slug || payload.old_record?.slug,
    });
  } catch (err) {
    console.error('trigger-rebuild', err);
    return jsonResponse({ error: err instanceof Error ? err.message : 'Rebuild dispatch failed' }, 500);
  }
});
