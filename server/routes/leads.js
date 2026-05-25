import { Router } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import { requireSupabase } from '../lib/supabase.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

const contactTopics = [
  'Order & Download Issues',
  'Template Customization Help',
  'Canva Access Questions',
  'Refunds & Returns',
  'Collaboration / Wholesale',
  'Other',
];

const submitSchema = z.object({
  name: z.string().trim().min(1).max(200),
  email: z.string().trim().email().max(320),
  topic: z.string().trim().max(120).optional().nullable(),
  message: z.string().trim().min(1).max(5000),
});

function mapLead(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    topic: row.topic,
    message: row.message,
    source: row.source,
    read_at: row.read_at,
    created_at: row.created_at,
  };
}

router.post('/', async (req, res) => {
  try {
    const body = submitSchema.parse(req.body);
    const supabase = requireSupabase();
    const ip_hash = crypto.createHash('sha256').update(req.ip || '').digest('hex').slice(0, 16);
    const topic =
      body.topic && contactTopics.includes(body.topic) ? body.topic : body.topic || null;

    const { data, error } = await supabase
      .from('leads')
      .insert({
        name: body.name,
        email: body.email.toLowerCase(),
        topic,
        message: body.message,
        source: 'contact',
        ip_hash,
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ ok: true, lead: mapLead(data) });
  } catch (e) {
    if (e.name === 'ZodError') {
      return res.status(400).json({ error: e.errors?.[0]?.message || 'Invalid form data' });
    }
    res.status(500).json({ error: e.message });
  }
});

const admin = Router();
admin.use(authMiddleware);

admin.get('/', async (req, res) => {
  try {
    const supabase = requireSupabase();
    let query = supabase.from('leads').select('*').order('created_at', { ascending: false });

    if (req.query.unread === '1') query = query.is('read_at', null);

    const { data, error } = await query;
    if (error) throw error;
    res.json({ leads: (data || []).map(mapLead) });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

admin.get('/:id', async (req, res) => {
  try {
    const supabase = requireSupabase();
    const { data, error } = await supabase.from('leads').select('*').eq('id', req.params.id).maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Lead not found' });
    res.json({ lead: mapLead(data) });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

admin.patch('/:id', async (req, res) => {
  try {
    const body = z
      .object({
        read: z.boolean().optional(),
      })
      .parse(req.body);

    const updates = {};
    if (body.read === true) updates.read_at = new Date().toISOString();
    if (body.read === false) updates.read_at = null;

    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from('leads')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) throw error;
    res.json({ lead: mapLead(data) });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

admin.delete('/:id', async (req, res) => {
  try {
    const supabase = requireSupabase();
    const { error } = await supabase.from('leads').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.use('/admin', admin);

export default router;
