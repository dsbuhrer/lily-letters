import { Router } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import { requireSupabase } from '../lib/supabase.js';
import { authMiddleware } from '../middleware/auth.js';
import { zodValidationResponse } from '../utils/validationErrors.js';

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
  name: z
    .string()
    .trim()
    .min(1, 'Please enter your name.')
    .max(200, 'Name must be 200 characters or fewer.'),
  email: z
    .string()
    .trim()
    .min(1, 'Please enter your email address.')
    .email('Please enter a valid email address (e.g. yourname@example.com).')
    .max(320, 'Email address is too long.'),
  topic: z.string().trim().max(120, 'Topic must be 120 characters or fewer.').optional().nullable(),
  message: z
    .string()
    .trim()
    .min(1, 'Please enter your message.')
    .max(5000, 'Message must be 5,000 characters or fewer.'),
});

function mapContact(row) {
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
      .from('contacts')
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
    res.status(201).json({ ok: true, contact: mapContact(data) });
  } catch (e) {
    if (e.name === 'ZodError') {
      return res.status(400).json(zodValidationResponse(e));
    }
    res.status(500).json({ error: e.message });
  }
});

const admin = Router();
admin.use(authMiddleware);

admin.get('/', async (req, res) => {
  try {
    const supabase = requireSupabase();
    let query = supabase.from('contacts').select('*').order('created_at', { ascending: false });

    if (req.query.unread === '1') query = query.is('read_at', null);

    const { data, error } = await query;
    if (error) throw error;
    res.json({ contacts: (data || []).map(mapContact) });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

admin.get('/:id', async (req, res) => {
  try {
    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('id', req.params.id)
      .maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Contact not found' });
    res.json({ contact: mapContact(data) });
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
      .from('contacts')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) throw error;
    res.json({ contact: mapContact(data) });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

admin.delete('/:id', async (req, res) => {
  try {
    const supabase = requireSupabase();
    const { error } = await supabase.from('contacts').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.use('/admin', admin);

export default router;
