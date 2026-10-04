import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native';

import { SignInPrompt } from '@/components/sign-in-prompt';
import { Banner, Button, Field } from '@/components/ui';
import { PHONE_RE } from '@/lib/checkout';
import { useAuth } from '@/providers/auth';
import { PAGE } from '@/theme';

export default function ProfileScreen() {
  const { session, profile, email, updateProfile } = useAuth();
  const [fullName, setFullName] = useState(profile?.fullName ?? '');
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [errors, setErrors] = useState<{ fullName?: string; phone?: string }>({});
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  if (!session) return <SignInPrompt title="Sign in to edit your details" body="Your name and phone are shared with the website." />;

  const save = async () => {
    const e: typeof errors = {};
    if (fullName.trim().length < 2) e.fullName = 'Enter your full name';
    if (phone.trim() && !PHONE_RE.test(phone.replace(/[\s-]/g, ''))) e.phone = 'Enter a valid Nigerian phone number';
    setErrors(e);
    if (Object.keys(e).length) return;
    setBusy(true);
    const err = await updateProfile({ fullName, phone });
    setBusy(false);
    if (err) return setMessage({ ok: false, text: err });
    setMessage({ ok: true, text: 'Saved — your details are updated on the website too.' });
    setTimeout(() => router.back(), 700);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ padding: PAGE, gap: 16 }} keyboardShouldPersistTaps="handled">
        {message && <Banner tone={message.ok ? 'ok' : 'error'}>{message.text}</Banner>}
        <Field label="Full name" value={fullName} onChangeText={setFullName} error={errors.fullName} autoComplete="name" />
        <Field label="Phone number" value={phone} onChangeText={setPhone} error={errors.phone} keyboardType="phone-pad" autoComplete="tel" placeholder="0803 000 0000" />
        <Field label="Email" value={email ?? ''} editable={false} hint="Your sign-in email can't be changed here." />
        <Button title="Save changes" onPress={save} loading={busy} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
