import { Link, router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { Text } from '@/components/text';

import { LogoMark } from '@/components/logo';
import { Banner, Button, Field, s } from '@/components/ui';
import { useAuth } from '@/providers/auth';
import { colors, PAGE } from '@/theme';

export default function SignupScreen() {
  const { signUp } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (name.trim().length < 2) return setError('Enter your full name.');
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError('Enter a valid email address.');
    if (password.length < 8) return setError('Password must be at least 8 characters.');
    if (password !== confirm) return setError("Passwords don't match.");
    setBusy(true);
    setError(null);
    const res = await signUp(name, email, password);
    setBusy(false);
    if (res.error) return setError(res.error);
    if (res.needsConfirmation) return setDone(`Almost done — we've sent a confirmation link to ${email.trim()}. Open it, then sign in here.`);
    router.back();
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ padding: PAGE, gap: 16 }} keyboardShouldPersistTaps="handled">
        <View style={{ alignItems: 'center', marginTop: 8, gap: 10 }}>
          <LogoMark size={52} />
          <Text style={[s.h1, { textAlign: 'center' }]}>Create your account</Text>
          <Text style={{ color: colors.ink600, textAlign: 'center' }}>One account for the app and the Apple Mike website.</Text>
        </View>
        {done ? (
          <>
            <Banner tone="ok">{done}</Banner>
            <Button title="Go to sign in" onPress={() => router.replace('/login')} />
          </>
        ) : (
          <>
            {error && <Banner>{error}</Banner>}
            <Field label="Full name" value={name} onChangeText={setName} autoComplete="name" textContentType="name" />
            <Field label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" textContentType="emailAddress" />
            <Field label="Password" hint="At least 8 characters" value={password} onChangeText={setPassword} secureTextEntry autoComplete="new-password" textContentType="newPassword" />
            <Field label="Confirm password" value={confirm} onChangeText={setConfirm} secureTextEntry autoComplete="new-password" textContentType="newPassword" onSubmitEditing={submit} />
            <Button title="Create account" onPress={submit} loading={busy} />
            <Text style={{ textAlign: 'center', color: colors.ink600, marginTop: 6 }}>
              Already have an account?{' '}
              <Link href="/login" replace style={{ color: colors.brand, fontWeight: '700' }}>
                Sign in
              </Link>
            </Text>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
