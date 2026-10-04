import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Switch, View } from 'react-native';
import { Text } from '@/components/text';

import { StatePicker } from '@/components/state-picker';
import { Banner, Button, Field } from '@/components/ui';
import { PHONE_RE } from '@/lib/checkout';
import { useAddresses } from '@/providers/addresses';
import { useAuth } from '@/providers/auth';
import { colors, PAGE } from '@/theme';

type Errors = Partial<Record<'fullName' | 'phone' | 'state' | 'city' | 'line1', string>>;

/** Add (no id) or edit (?id=…) an address. */
export default function AddressFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { addresses, save } = useAddresses();
  const { profile } = useAuth();
  const existing = addresses.find((a) => a.id === id);

  const [fullName, setFullName] = useState(existing?.fullName ?? profile?.fullName ?? '');
  const [phone, setPhone] = useState(existing?.phone ?? profile?.phone ?? '');
  const [state, setState] = useState(existing?.state ?? 'FCT (Abuja)');
  const [city, setCity] = useState(existing?.city ?? '');
  const [line1, setLine1] = useState(existing?.line1 ?? '');
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [isDefault, setIsDefault] = useState(existing?.isDefault ?? addresses.length === 0);
  const [errors, setErrors] = useState<Errors>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const e: Errors = {};
    if (fullName.trim().length < 2) e.fullName = "Enter the recipient's name";
    if (!PHONE_RE.test(phone.replace(/[\s-]/g, ''))) e.phone = 'Enter a valid Nigerian phone number';
    if (!state) e.state = 'Choose a state';
    if (city.trim().length < 2) e.city = 'Enter the city or area';
    if (line1.trim().length < 6) e.line1 = 'Enter the street address';
    setErrors(e);
    if (Object.keys(e).length) return;
    setBusy(true);
    const err = await save({ fullName, phone, state, city, line1, notes, isDefault }, existing?.id);
    setBusy(false);
    if (err) return setError(err);
    router.back();
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Stack.Screen options={{ title: existing ? 'Edit address' : 'New address' }} />
      <ScrollView contentContainerStyle={{ padding: PAGE, gap: 16 }} keyboardShouldPersistTaps="handled">
        {error && <Banner>{error}</Banner>}
        <Field label="Recipient name" value={fullName} onChangeText={setFullName} error={errors.fullName} autoComplete="name" />
        <Field label="Phone number" value={phone} onChangeText={setPhone} error={errors.phone} keyboardType="phone-pad" autoComplete="tel" />
        <StatePicker value={state} onChange={setState} error={errors.state} />
        <Field label="City / area" value={city} onChangeText={setCity} error={errors.city} placeholder="e.g. Wuse 2" />
        <Field label="Street address" value={line1} onChangeText={setLine1} error={errors.line1} placeholder="House number, street, landmark" autoComplete="street-address" />
        <Field label="Delivery notes (optional)" value={notes} onChangeText={setNotes} multiline />
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ fontWeight: '600', color: colors.ink950 }}>Use as my default address</Text>
          <Switch value={isDefault} onValueChange={setIsDefault} trackColor={{ true: colors.brand }} disabled={existing?.isDefault} />
        </View>
        <Button title={existing ? 'Save address' : 'Add address'} onPress={submit} loading={busy} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
