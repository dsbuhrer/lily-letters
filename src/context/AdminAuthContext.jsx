import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getSupabaseClient, isSupabaseConfigured } from '../lib/supabaseClient';
import { checkIsAdmin } from '../lib/supabase/adminAuth';

const AdminAuthContext = createContext(null);

const ADMIN_REFRESH_TIMEOUT_MS = 10_000;

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Admin auth timeout')), ms);
    }),
  ]);
}

export function AdminAuthProvider({ children }) {
  const supabase = getSupabaseClient();
  const [session, setSession] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const refreshAdmin = useCallback(async () => {
    if (!supabase) {
      setIsAdmin(false);
      return false;
    }
    try {
      const {
        data: { session: current },
      } = await withTimeout(supabase.auth.getSession(), ADMIN_REFRESH_TIMEOUT_MS);
      setSession(current);
      if (!current) {
        setIsAdmin(false);
        return false;
      }
      const ok = await withTimeout(checkIsAdmin(), ADMIN_REFRESH_TIMEOUT_MS);
      setIsAdmin(ok);
      return ok;
    } catch (err) {
      console.warn('refreshAdmin:', err);
      setIsAdmin(false);
      return false;
    }
  }, [supabase]);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return undefined;
    }
    refreshAdmin()
      .catch((err) => console.warn('refreshAdmin:', err))
      .finally(() => setLoading(false));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      refreshAdmin();
    });
    return () => subscription.unsubscribe();
  }, [supabase, refreshAdmin]);

  const login = useCallback(
    async (email, password) => {
      if (!supabase) throw new Error('Supabase is not configured');
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw new Error(error.message);
      const ok = await checkIsAdmin();
      if (!ok) {
        await supabase.auth.signOut();
        throw new Error('This account does not have admin access');
      }
      setSession(data.session);
      setIsAdmin(true);
      return { user: data.user };
    },
    [supabase],
  );

  const logout = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setSession(null);
    setIsAdmin(false);
  }, [supabase]);

  const value = useMemo(
    () => ({
      session,
      isAdmin,
      loading,
      configured: isSupabaseConfigured(),
      login,
      logout,
      refreshAdmin,
    }),
    [session, isAdmin, loading, login, logout, refreshAdmin],
  );

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error('useAdminAuth must be used within AdminAuthProvider');
  return ctx;
}
