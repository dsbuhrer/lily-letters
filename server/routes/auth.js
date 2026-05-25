import { Router } from 'express';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { requireSupabase } from '../lib/supabase.js';
import { signToken, setAuthCookie, clearAuthCookie, authMiddleware } from '../middleware/auth.js';

const router = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const supabase = requireSupabase();
    const { data: user, error } = await supabase
      .from('admin_users')
      .select('id, email, name, password_hash')
      .eq('email', email.toLowerCase())
      .single();

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'Invalid email or password' });

    await supabase
      .from('admin_users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', user.id);

    const token = signToken({ id: user.id, email: user.email, name: user.name });
    setAuthCookie(res, token);
    res.json({ user: { id: user.id, email: user.email, name: user.name } });
  } catch (e) {
    if (e.name === 'ZodError') return res.status(400).json({ error: e.errors });
    res.status(e.status || 500).json({ error: e.message });
  }
});

router.post('/logout', (_req, res) => {
  clearAuthCookie(res);
  res.json({ ok: true });
});

router.get('/me', authMiddleware, (req, res) => {
  res.json({ user: { id: req.admin.id, email: req.admin.email, name: req.admin.name } });
});

export default router;
