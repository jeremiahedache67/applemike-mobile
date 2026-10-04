import type { Session } from '@supabase/supabase-js';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';

import { config } from '@/lib/config';
import { friendlyError } from '@/lib/format';
import { watchTable } from '@/lib/realtime';
import { supabase } from '@/lib/supabase';

// Accounts are Supabase Auth — the same accounts the website uses. An account created in the app
// can sign in on the website and vice versa.

export interface Profile {
  fullName: string;
  phone: string;
  avatarUrl: string | null;
}

interface AuthState {
  session: Session | null;
  email: string | null;
  profile: Profile | null;
  ready: boolean;
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (fullName: string, email: string, password: string) => Promise<{ error: string | null; needsConfirmation: boolean }>;
  resetPassword: (email: string) => Promise<string | null>;
  updateProfile: (p: { fullName: string; phone: string }) => Promise<string | null>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

async function fetchProfile(uid: string): Promise<Profile | null> {
  const { data } = await supabase.from('profiles').select('full_name, phone, avatar_url').eq('id', uid).maybeSingle();
  return data ? { fullName: data.full_name ?? '', phone: data.phone ?? '', avatarUrl: data.avatar_url } : null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  // Keyed by user id, so a previous account's profile is never shown after switching accounts.
  const [profileState, setProfileState] = useState<{ uid: string; profile: Profile } | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    // Also fires TOKEN_REFRESHED and SIGNED_OUT (e.g. when a refresh token has expired).
    const { data } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  const userId = session?.user.id ?? null;
  const profile = profileState && profileState.uid === userId ? profileState.profile : null;

  const loadProfile = useCallback(() => {
    if (!userId) return Promise.resolve();
    return fetchProfile(userId).then((p) => {
      if (p) setProfileState({ uid: userId, profile: p });
    });
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    fetchProfile(userId).then((p) => p && setProfileState({ uid: userId, profile: p }));
    return watchTable('profiles', `id=eq.${userId}`, () => void loadProfile());
  }, [userId, loadProfile]);

  const value: AuthState = {
    session,
    email: session?.user.email ?? null,
    profile,
    ready,
    async signIn(email, password) {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
      if (!error) return null;
      if (error.code === 'email_not_confirmed') return 'Please confirm your email first — check your inbox for the link we sent.';
      if (error.code === 'invalid_credentials') return 'Incorrect email or password.';
      return friendlyError(error, 'Incorrect email or password.');
    },
    async signUp(fullName, email, password) {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        // The confirmation link opens the website, which completes the sign-up there.
        options: { data: { full_name: fullName.trim() }, emailRedirectTo: `${config.siteUrl}/auth/callback?next=/account` },
      });
      if (error) {
        if (error.code === 'user_already_exists') return { error: 'An account with this email already exists. Try signing in.', needsConfirmation: false };
        if (error.code === 'weak_password') return { error: 'Please choose a stronger password.', needsConfirmation: false };
        return { error: friendlyError(error, "We couldn't create your account. Please try again."), needsConfirmation: false };
      }
      return { error: null, needsConfirmation: !data.session };
    },
    async resetPassword(email) {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: `${config.siteUrl}/auth/callback?next=/reset-password`,
      });
      return error ? friendlyError(error, "We couldn't send the reset link. Please try again.") : null;
    },
    async updateProfile({ fullName, phone }) {
      if (!userId) return 'Please sign in again.';
      const { error } = await supabase.from('profiles').update({ full_name: fullName.trim(), phone: phone.replace(/[\s-]/g, '') || null }).eq('id', userId);
      if (error) return friendlyError(error, "We couldn't save your details. Please try again.");
      await loadProfile();
      return null;
    },
    async signOut() {
      await supabase.auth.signOut();
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
