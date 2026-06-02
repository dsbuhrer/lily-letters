import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { isEmailConfirmed } from '../lib/authEmail';
import { getSupabaseClient, isSupabaseConfigured } from '../lib/supabaseClient';

const AuthContext = createContext(null);

async function claimGuestOrders(supabase, user) {
  if (!isEmailConfirmed(user)) return;
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

    supabase.auth
      .getSession()
      .then(({ data: { session: current } }) => {
        setSession(current);
        if (current?.user) {
          fetchProfile(current.user.id);
        }
      })
      .catch((err) => {
        console.warn('getSession:', err);
      })
      .finally(() => {
        setLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      setSession(nextSession);
      if (nextSession?.user) {
        await claimGuestOrders(supabase, nextSession.user);
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

      if (data.session && isEmailConfirmed(data.user)) {
        await claimGuestOrders(supabase, data.user);
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
      if (data.user && isEmailConfirmed(data.user)) {
        await claimGuestOrders(supabase, data.user);
        await fetchProfile(data.user.id);
      }
      return data;
    },
    [supabase, fetchProfile],
  );

  const resendConfirmationEmail = useCallback(
    async (email) => {
      if (!supabase) throw new Error('Account system is not configured');
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email.trim(),
      });
      if (error) throw error;
    },
    [supabase],
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

  const user = session?.user ?? null;
  const emailConfirmed = isEmailConfirmed(user);

  const value = useMemo(
    () => ({
      session,
      user,
      emailConfirmed,
      profile,
      loading,
      configured: isSupabaseConfigured(),
      signUp,
      signIn,
      signOut,
      resetPassword,
      resendConfirmationEmail,
      updateProfile,
      refreshProfile,
      supabase,
    }),
    [
      session,
      user,
      emailConfirmed,
      profile,
      loading,
      signUp,
      signIn,
      signOut,
      resetPassword,
      resendConfirmationEmail,
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
