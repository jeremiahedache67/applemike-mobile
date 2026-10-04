import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';

import { supabase } from './supabase';

// "Continue with Google" — the same Google sign-in (Supabase Auth + Google Cloud OAuth client)
// the website uses, so it's the same Apple Mike account on both.
// Flow: open Google in a secure in-app browser → Supabase redirects back to this app with a
// one-time code (PKCE) → exchange it for a session.
//
// The redirect URL must be allowed in Supabase → Authentication → URL Configuration:
//   exp://**        (development in Expo Go)
//   applemike://**  (installed builds)

export const googleRedirectUrl = () => Linking.createURL('auth-callback');

export type GoogleResult = { ok: true } | { ok: false; cancelled: boolean; error: string | null };

export async function signInWithGoogle(): Promise<GoogleResult> {
  const redirectTo = googleRedirectUrl();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo, skipBrowserRedirect: true, queryParams: { prompt: 'select_account' } },
  });
  if (error || !data.url) return { ok: false, cancelled: false, error: "We couldn't reach Google. Check your connection and try again." };

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type !== 'success') return { ok: false, cancelled: true, error: null };
  return completeGoogleSignIn(result.url);
}

/** Finishes sign-in from the redirect URL (also used by the auth-callback route on Android). */
export async function completeGoogleSignIn(url: string): Promise<GoogleResult> {
  const { queryParams } = Linking.parse(url);
  const code = typeof queryParams?.code === 'string' ? queryParams.code : null;
  const providerError = typeof queryParams?.error_description === 'string' ? queryParams.error_description : null;
  if (!code) {
    return providerError?.toLowerCase().includes('denied')
      ? { ok: false, cancelled: true, error: null }
      : { ok: false, cancelled: false, error: "Google sign-in didn't complete. Please try again." };
  }
  const { data: existing } = await supabase.auth.getSession();
  if (existing.session) return { ok: true }; // already completed by the other handler
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return { ok: false, cancelled: false, error: "Google sign-in didn't complete. Please try again." };
  return { ok: true };
}
