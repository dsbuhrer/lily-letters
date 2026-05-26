import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getSupabaseClient, isSupabaseConfigured } from '../lib/supabaseClient';

const AuthContext = createContext(null);

async function claimGuestOrders(supabase) {
  const { error } = await supabase.rpc('claim_orders_by_email');
  if (error) {
    console.warn('claim_orders_by_email:', error.message);
  }
}

export function AuthProvider({ children }) {
  const supabase = getSupabaseClient();
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (userId) => {
    if (!supabase || !userId) {
      setProfile(null);
      return;
    }
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    if (!error) setProfile(data);
  }, [supabase]);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return undefined;
    }

    supabase.auth.getSession().then(({ data: { session: current } }) => {
      setSession(current);
      if (current?.user) {
        fetchProfile(current.user.id);
      }
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      setSession(nextSession);
      if (nextSession?.user) {
        await claimGuestOrders(supabase);
        await fetchProfile(nextSession.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase, fetchProfile]);

  const signUp = useCallback(
    async (email, password, metadata = {}) => {
      if (!supabase) throw new Error('Account system is not configured');
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
          emailRedirectTo: `${window.location.origin}/account`,
        },
      });
      if (error) throw error;

      if (data.user && metadata.firstName) {
        await supabase
          .from('profiles')
          .update({
            first_name: metadata.firstName,
            last_name: metadata.lastName || null,
          })
          .eq('id', data.user.id);
      }

      if (data.session) {
        await claimGuestOrders(supabase);
        await fetchProfile(data.user.id);
      }

      return data;
    },
    [supabase, fetchProfile],
  );

  const signIn = useCallback(
    async (email, password) => {
      if (!supabase) throw new Error('Account system is not configured');
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      await claimGuestOrders(supabase);
      if (data.user) await fetchProfile(data.user.id);
      return data;
    },
    [supabase, fetchProfile],
  );

  const signOut = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setProfile(null);
  }, [supabase]);

  const resetPassword = useCallback(
    async (email) => {
      if (!supabase) throw new Error('Account system is not configured');
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/account/settings`,
      });
      if (error) throw error;
    },
    [supabase],
  );

  const updateProfile = useCallback(
    async (updates) => {
      if (!supabase || !session?.user) throw new Error('Not signed in');
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', session.user.id)
        .select('*')
        .single();
      if (error) throw error;
      setProfile(data);
      return data;
    },
    [supabase, session],
  );

  const refreshProfile = useCallback(() => {
    if (session?.user) return fetchProfile(session.user.id);
    return Promise.resolve();
  }, [session, fetchProfile]);

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      loading,
      configured: isSupabaseConfigured(),
      signUp,
      signIn,
      signOut,
      resetPassword,
      updateProfile,
      refreshProfile,
      supabase,
    }),
    [
      session,
      profile,
      loading,
      signUp,
      signIn,
      signOut,
      resetPassword,
      updateProfile,
      refreshProfile,
      supabase,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
