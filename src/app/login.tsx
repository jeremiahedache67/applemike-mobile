import { Link, router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';

import { LogoMark } from '@/components/logo';
import { Banner, Button, Field, s } from '@/components/ui';
import { useAuth } from '@/providers/auth';
import { colors, PAGE } from '@/theme';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!email.trim() || !password) return setError('Enter your email and password.');
    setBusy(true);
    setError(null);
    const err = await signIn(email, password);
    setBusy(false);
    if (err) return setError(err);
    router.back();
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ padding: PAGE, gap: 16 }} keyboardShouldPersistTaps="handled">
        <View style={{ alignItems: 'center', marginTop: 8, gap: 10 }}>
          <LogoMark size={52} />
          <Text style={[s.h1, { textAlign: 'center' }]}>Welcome back</Text>
          <Text style={{ color: colors.ink600, textAlign: 'center' }}>Use the same email and password as the Apple Mike website.</Text>
        </View>
        {error && <Banner>{error}</Banner>}
        <Field label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" textContentType="emailAddress" returnKeyType="next" />
        <Field label="Password" value={password} onChangeText={setPassword} secureTextEntry autoComplete="current-password" textContentType="password" returnKeyType="go" onSubmitEditing={submit} />
        <Link href="/forgot-password" style={{ color: colors.brand, fontWeight: '700', alignSelf: 'flex-end' }}>
          Forgot password?
        </Link>
        <Button title="Sign in" onPress={submit} loading={busy} />
        <Text style={{ textAlign: 'center', color: colors.ink600, marginTop: 6 }}>
          New to Apple Mike?{' '}
          <Link href="/signup" replace style={{ color: colors.brand, fontWeight: '700' }}>
            Create an account
          </Link>
        </Text>
        <Text style={{ textAlign: 'center', color: colors.ink500, fontSize: 12, marginTop: 6 }}>
          Signed up with Google on the website? Tap “Forgot password?” to set a password for the app.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
