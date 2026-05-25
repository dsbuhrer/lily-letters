import 'dotenv/config';

const required = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'JWT_SECRET'];

export function getConfig() {
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length && process.env.NODE_ENV === 'production') {
    console.warn(`Missing env: ${missing.join(', ')}`);
  }

  return {
    siteUrl: (process.env.SITE_URL || 'http://localhost:5173').replace(/\/$/, ''),
    port: Number(process.env.PORT || 3001),
    nodeEnv: process.env.NODE_ENV || 'development',
    supabaseUrl: process.env.SUPABASE_URL || '',
    supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
    adminEmail: process.env.ADMIN_EMAIL || 'admin@thelilyletters.co',
    adminPassword: process.env.ADMIN_PASSWORD || 'admin123',
    isDev: process.env.NODE_ENV !== 'production',
  };
}
