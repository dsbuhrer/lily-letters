import { Router } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import { requireSupabase } from '../lib/supabase.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

const subscribeSchema = z.object({
  email: z.string().email(),
  source: z.enum(['footer', 'blog', 'checkout']).default('footer'),
});

router.post('/', async (req, res) => {
  try {
    const { email, source } = subscribeSchema.parse(req.body);
    const supabase = requireSupabase();
    const ip_hash = crypto.createHash('sha256').update(req.ip || '').digest('hex').slice(0, 16);

    const { error } = await supabase.from('subscribers').upsert(
      { email: email.toLowerCase(), source, consent_at: new Date().toISOString(), ip_hash, unsubscribed_at: null },
      { onConflict: 'email' },
    );

    if (error) throw error;
    res.status(201).json({ ok: true, message: 'Subscribed successfully' });
  } catch (e) {
    if (e.code === '23505') return res.status(409).json({ error: 'Email already subscribed' });
    res.status(e.status || 500).json({ error: e.message });
  }
});

const admin = Router();
admin.use(authMiddleware);

admin.get('/', async (req, res) => {
  try {
    const supabase = requireSupabase();
    let query = supabase
      .from('subscribers')
      .select('*')
      .is('unsubscribed_at', null)
      .order('created_at', { ascending: false });

    if (req.query.source) query = query.eq('source', req.query.source);
    if (req.query.q) query = query.ilike('email', `%${req.query.q}%`);

    const { data, error } = await query;
    if (error) throw error;
    res.json({ subscribers: data });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

admin.get('/export', async (_req, res) => {
  try {
    const supabase = requireSupabase();
    const { data } = await supabase
      .from('subscribers')
      .select('email, source, consent_at, created_at')
      .is('unsubscribed_at', null)
      .order('created_at', { ascending: false });

    const header = 'email,source,consent_at,created_at\n';
    const rows = (data || [])
      .map((s) => `${s.email},${s.source},${s.consent_at},${s.created_at}`)
      .join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=subscribers.csv');
    res.send(header + rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.use('/admin', admin);

export default router;
