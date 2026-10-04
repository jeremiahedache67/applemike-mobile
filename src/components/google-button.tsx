import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { signInWithGoogle } from '@/lib/google-auth';
import { colors } from '@/theme';
import { Text } from './text';
import { s } from './ui';

/** "Continue with Google" — same Google sign-in as the website. */
export function GoogleButton({ onError }: { onError: (message: string) => void }) {
  const [busy, setBusy] = useState(false);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Continue with Google"
      disabled={busy}
      onPress={async () => {
        setBusy(true);
        const res = await signInWithGoogle();
        setBusy(false);
        if (res.ok) {
          if (router.canGoBack()) router.back();
        } else if (res.error) onError(res.error);
      }}
      style={({ pressed }) => [s.btn, { borderWidth: 1, borderColor: colors.ink200, backgroundColor: pressed ? colors.ink50 : colors.white }, busy && { opacity: 0.6 }]}>
      {busy ? (
        <ActivityIndicator color={colors.ink950} />
      ) : (
        <>
          <GoogleIcon />
          <Text style={[s.btnText, { color: colors.ink950 }]}>Continue with Google</Text>
        </>
      )}
    </Pressable>
  );
}

export function OrDivider() {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 4 }}>
      <View style={{ flex: 1, height: 1, backgroundColor: colors.ink200 }} />
      <Text style={{ color: colors.ink400, fontSize: 12, fontWeight: '600', letterSpacing: 1 }}>OR</Text>
      <View style={{ flex: 1, height: 1, backgroundColor: colors.ink200 }} />
    </View>
  );
}

function GoogleIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24">
      <Path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
      <Path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
      <Path fill="#FBBC05" d="M5.84 14.1A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.1V7.06H2.18A11 11 0 0 0 1 12c0 1.78.43 3.45 1.18 4.94l3.66-2.84z" />
      <Path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A10.96 10.96 0 0 0 12 1 11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
    </Svg>
  );
}
