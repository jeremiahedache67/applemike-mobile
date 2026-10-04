import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

import { supabase } from './supabase';

// "Continue with Google" — the same Google sign-in (Supabase Auth + Google Cloud OAuth client)
// the website uses, so it's the same Apple Mike account on both.
// Flow: open Google in a secure in-app browser → Supabase redirects back to this app with a
// one-time code (PKCE) → exchange it for a session.
//
// The redirect URL must be allowed in Supabase → Authentication → URL Configuration:
//   exp://**        (development in Expo Go)
//   applemike://**  (installed builds)

// Android: always name a real browser. Without this, Android may hand the sign-in page to another
// app that claims https links but refuses to open them (seen with OPay), which crashes the app.
const KNOWN_BROWSERS = ['com.android.chrome', 'com.sec.android.app.sbrowser', 'com.brave.browser', 'org.mozilla.firefox', 'com.microsoft.emmx', 'com.opera.browser'];

async function pickAndroidBrowser(): Promise<string | undefined> {
  if (Platform.OS !== 'android') return undefined;
  try {
    const { preferredBrowserPackage, defaultBrowserPackage, servicePackages, browserPackages } = await WebBrowser.getCustomTabsSupportingBrowsersAsync();
    const capable = servicePackages.length ? servicePackages : browserPackages;
    if (preferredBrowserPackage) return preferredBrowserPackage;
    if (defaultBrowserPackage && capable.includes(defaultBrowserPackage)) return defaultBrowserPackage;
    return KNOWN_BROWSERS.find((p) => capable.includes(p)) ?? capable[0];
  } catch {
    return undefined;
  }
}

export const googleRedirectUrl = () => Linking.createURL('auth-callback');

export type GoogleResult = { ok: true } | { ok: false; cancelled: boolean; error: string | null };

export async function signInWithGoogle(): Promise<GoogleResult> {
  const redirectTo = googleRedirectUrl();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo, skipBrowserRedirect: true, queryParams: { prompt: 'select_account' } },
  });
  if (error || !data.url) return { ok: false, cancelled: false, error: "We couldn't reach Google. Check your connection and try again." };

  const browserPackage = await pickAndroidBrowser();
  let result: WebBrowser.WebBrowserAuthSessionResult;
  try {
    result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo, browserPackage ? { browserPackage } : undefined);
  } catch {
    return { ok: false, cancelled: false, error: "We couldn't open Google sign-in. Please make sure Chrome is installed, or sign in with your email and password." };
  }
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
