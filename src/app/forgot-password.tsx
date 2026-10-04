import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Text } from '@/components/text';

import { Banner, Button, Field, s } from '@/components/ui';
import { useAuth } from '@/providers/auth';
import { colors, PAGE } from '@/theme';

// Uses the website's password-reset flow: the emailed link opens the website's "Set a new password" page.
export default function ForgotPasswordScreen() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const submit = async () => {
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setMessage({ ok: false, text: 'Enter a valid email address.' });
    setBusy(true);
    const err = await resetPassword(email);
    setBusy(false);
    // Same answer whether or not the account exists, so emails can't be probed.
    setMessage(err ? { ok: false, text: err } : { ok: true, text: `If an account exists for ${email.trim()}, a reset link is on its way. Open it, set a new password, then sign in here.` });
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ padding: PAGE, gap: 16 }} keyboardShouldPersistTaps="handled">
        <Text style={s.h1}>Forgot your password?</Text>
        <Text style={{ color: colors.ink600 }}>Enter your email and we&apos;ll send you a link to set a new one.</Text>
        {message && <Banner tone={message.ok ? 'ok' : 'error'}>{message.text}</Banner>}
        {!message?.ok && (
          <>
            <Field label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" onSubmitEditing={submit} />
            <Button title="Send reset link" onPress={submit} loading={busy} />
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
