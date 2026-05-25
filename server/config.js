import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const required = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'JWT_SECRET'];

function env(name) {
  const v = process.env[name];
  if (v == null) return '';
  return String(v).trim().replace(/^['"]|['"]$/g, '');
}

export function getConfig() {
  const missing = required.filter((k) => !env(k));
  if (missing.length && process.env.NODE_ENV === 'production') {
    console.warn(`Missing env: ${missing.join(', ')}`);
  }

  return {
    siteUrl: (env('SITE_URL') || 'http://localhost:5173').replace(/\/$/, ''),
    port: Number(env('PORT') || 3001),
    nodeEnv: env('NODE_ENV') || 'development',
    supabaseUrl: env('SUPABASE_URL'),
    supabaseServiceKey: env('SUPABASE_SERVICE_ROLE_KEY'),
    jwtSecret: env('JWT_SECRET') || 'dev-secret-change-in-production',
    adminEmail: env('ADMIN_EMAIL') || 'admin@thelilyletters.co',
    adminPassword: env('ADMIN_PASSWORD') || 'admin123',
    geminiApiKey: env('GEMINI_API_KEY'),
    isDev: env('NODE_ENV') !== 'production',
  };
}

export function validateSupabaseConfig() {
  const { supabaseUrl, supabaseServiceKey } = getConfig();
  if (!supabaseUrl || !supabaseServiceKey) {
    return {
      ok: false,
      message:
        'Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no arquivo .env na raiz do projeto e reinicie o servidor (npm run dev:server ou npm run dev:full).',
    };
  }
  if (!supabaseUrl.includes('supabase.co')) {
    return { ok: false, message: 'SUPABASE_URL deve ser https://SEU-REF.supabase.co (Dashboard → Project Settings → API).' };
  }
  if (!supabaseServiceKey.startsWith('eyJ') || supabaseServiceKey.length < 100) {
    return {
      ok: false,
      message:
        'SUPABASE_SERVICE_ROLE_KEY inválida. No Supabase: Project Settings → API → copie a chave service_role (JWT longa), não a anon key.',
    };
  }
  return { ok: true };
}
