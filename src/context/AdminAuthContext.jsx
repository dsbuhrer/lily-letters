import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { getSupabaseClient, isSupabaseConfigured } from '../lib/supabaseClient';
import { checkIsAdmin } from '../lib/supabase/adminAuth';

const AdminAuthContext = createContext(null);

export function AdminAuthProvider({ children }) {
  const supabase = getSupabaseClient();
  const [session, setSession] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const initialSessionHandled = useRef(false);

  const resolveAdminFromSession = useCallback(async (nextSession) => {
    setSession(nextSession);
    if (!nextSession) {
      setIsAdmin(false);
      return false;
    }
    try {
      const ok = await checkIsAdmin();
      setIsAdmin(ok);
      return ok;
    } catch (err) {
      console.warn('resolveAdminFromSession:', err);
      setIsAdmin(false);
      return false;
    }
  }, []);

  const refreshAdmin = useCallback(async () => {
    if (!supabase) {
      setIsAdmin(false);
      return false;
    }
    return resolveAdminFromSession(session);
  }, [supabase, session, resolveAdminFromSession]);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return undefined;
    }

    let mounted = true;
    initialSessionHandled.current = false;

    const finishInitialLoad = () => {
      if (!mounted || initialSessionHandled.current) return;
      initialSessionHandled.current = true;
      setLoading(false);
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      // Never call getSession() here — it deadlocks when AuthContext also uses auth.
      setTimeout(() => {
        if (!mounted) return;
        resolveAdminFromSession(nextSession)
          .catch((err) => console.warn('admin auth:', err))
          .finally(() => {
            if (event === 'INITIAL_SESSION') {
              finishInitialLoad();
            }
          });
      }, 0);
    });

    // Fallback if INITIAL_SESSION never fires (should not happen on supported clients).
    const fallbackTimer = setTimeout(finishInitialLoad, 3_000);

    return () => {
      mounted = false;
      clearTimeout(fallbackTimer);
      subscription.unsubscribe();
    };
  }, [supabase, resolveAdminFromSession]);

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
