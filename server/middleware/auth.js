import jwt from 'jsonwebtoken';
import { getConfig } from '../config.js';

const COOKIE_NAME = 'lily_admin_token';

export function signToken(payload) {
  const { jwtSecret } = getConfig();
  return jwt.sign(payload, jwtSecret, { expiresIn: '7d' });
}

export function authMiddleware(req, res, next) {
  const token =
    req.cookies?.[COOKIE_NAME] ||
    (req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.slice(7)
      : null);

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { jwtSecret } = getConfig();
    req.admin = jwt.verify(token, jwtSecret);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }
}

export function setAuthCookie(res, token) {
  const { isDev } = getConfig();
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: !isDev,
    // lax: mesmo host via proxy Vite; none: fallback se o front chamar :3001 direto em dev
    sameSite: isDev ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  });
}

export function clearAuthCookie(res) {
  res.clearCookie(COOKIE_NAME, { path: '/' });
}

export { COOKIE_NAME };
