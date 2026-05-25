import { Router } from 'express';
import { requireSupabase } from '../lib/supabase.js';

const router = Router();

router.get('/', async (_req, res) => {
  try {
    const supabase = requireSupabase();
    const { data, error } = await supabase.from('categories').select('*').order('sort_order');
    if (error) throw error;
    res.json({ categories: data });
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message });
  }
});

export default router;
