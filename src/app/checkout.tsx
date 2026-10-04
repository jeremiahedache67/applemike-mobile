import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { Text } from '@/components/text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { StatePicker } from '@/components/state-picker';
import { Banner, Button, EmptyState, Field, s } from '@/components/ui';
import { PHONE_RE, placeOrder } from '@/lib/checkout';
import { store } from '@/lib/config';
import { naira } from '@/lib/format';
import { useAddresses } from '@/providers/addresses';
import { useAuth } from '@/providers/auth';
import { useCart } from '@/providers/cart';
import { useCatalog } from '@/providers/catalog';
import { colors, fonts, PAGE, radius } from '@/theme';

type Errors = Partial<Record<'fullName' | 'email' | 'phone' | 'state' | 'city' | 'address', string>>;

export default function CheckoutScreen() {
  const insets = useSafeAreaInsets();
  const { session, profile, email: accountEmail } = useAuth();
  const { addresses } = useAddresses();
  const cart = useCart();
  const { refresh: refreshCatalog } = useCatalog();

  const initial = addresses.find((a) => a.isDefault) ?? addresses[0];
  const [fullName, setFullName] = useState(profile?.fullName ?? '');
  const [email, setEmail] = useState(accountEmail ?? '');
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [fulfilment, setFulfilment] = useState<'delivery' | 'pickup'>('delivery');
  const [addressId, setAddressId] = useState<string>(initial?.id ?? 'new');
  const [state, setState] = useState(initial?.state ?? 'FCT (Abuja)');
  const [city, setCity] = useState(initial?.city ?? '');
  const [address, setAddress] = useState(initial?.line1 ?? '');
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [saveAddress, setSaveAddress] = useState(true);
  const [errors, setErrors] = useState<Errors>({});
  const [banner, setBanner] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const scroll = useRef<ScrollView>(null);

  const lines = useMemo(() => cart.lines.filter((l) => !l.unavailable), [cart.lines]);

  const pick = (id: string) => {
    setAddressId(id);
    const a = addresses.find((x) => x.id === id);
    setState(a?.state ?? 'FCT (Abuja)');
    setCity(a?.city ?? '');
    setAddress(a?.line1 ?? '');
    setNotes(a?.notes ?? '');
    setErrors({});
  };

  const validate = (): Errors => {
    const e: Errors = {};
    if (fullName.trim().length < 2) e.fullName = 'Enter your full name';
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) e.email = 'Enter a valid email';
    if (!PHONE_RE.test(phone.replace(/[\s-]/g, ''))) e.phone = 'Enter a valid Nigerian phone number';
    if (fulfilment === 'delivery') {
      if (!state) e.state = 'Choose your state';
      if (city.trim().length < 2) e.city = 'Enter your city or area';
      if (address.trim().length < 6) e.address = 'Enter your delivery address';
    }
    return e;
  };

  const submit = async () => {
    if (submitting) return; // no double orders
    const e = validate();
    setErrors(e);
    setBanner(null);
    if (Object.keys(e).length) {
      scroll.current?.scrollTo({ y: 0, animated: true });
      return;
    }
    setSubmitting(true);
    const res = await placeOrder({
      fullName,
      email,
      phone,
      fulfilment,
      state,
      city,
      address,
      notes,
      saveAddress: Boolean(session) && addressId === 'new' && saveAddress,
      lines: lines.map((l) => ({ variantId: l.variantId, quantity: l.quantity })),
    });
    setSubmitting(false);

    if (res.ok) {
      await cart.clear();
      router.replace({ pathname: '/order-success', params: { orderNumber: res.orderNumber ?? '', email: email.trim(), fulfilment } });
      return;
    }
    if (res.kind === 'invalid') {
      setErrors(res.fieldErrors as Errors);
      setBanner('Please check the highlighted details.');
    } else if (res.kind === 'cart-changed') {
      await Promise.all([refreshCatalog(), cart.refresh()]);
      setBanner('Some items in your cart changed (sold out or price/quantity updated). Please review your cart and try again.');
    } else if (res.kind === 'unauthorized') {
      setBanner(res.message);
      router.push('/login');
    } else {
      setBanner(res.message);
    }
    scroll.current?.scrollTo({ y: 0, animated: true });
  };

  if (!lines.length && !submitting) {
    return <EmptyState icon="bag-outline" title="Nothing to check out" body="Your cart is empty." action={<Button title="Browse gadgets" onPress={() => router.navigate('/')} />} />;
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
      <ScrollView ref={scroll} contentContainerStyle={{ padding: PAGE, gap: 22, paddingBottom: 24 }} keyboardShouldPersistTaps="handled">
        {banner && <Banner>{banner}</Banner>}
        {!session && (
          <Pressable onPress={() => router.push('/login')} accessibilityRole="button">
            <Banner tone="info">Have an account? Tap to sign in for saved addresses and to track this order.</Banner>
          </Pressable>
        )}

        <Section n={1} title="Contact">
          <Field label="Full name" value={fullName} onChangeText={setFullName} error={errors.fullName} autoComplete="name" textContentType="name" />
          <Field label="Email" value={email} onChangeText={setEmail} error={errors.email} hint="Your receipt and order updates go here." keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
          <Field label="Phone number" value={phone} onChangeText={setPhone} error={errors.phone} hint="We'll call this number about your order." keyboardType="phone-pad" autoComplete="tel" placeholder="0803 000 0000" />
        </Section>

        <Section n={2} title="Delivery or pick-up">
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {(
              [
                { v: 'delivery', icon: 'car-outline', t: 'Deliver to me', d: 'Nationwide' },
                { v: 'pickup', icon: 'location-outline', t: 'Pick up', d: 'Free, in store' },
              ] as const
            ).map((o) => (
              <Pressable
                key={o.v}
                onPress={() => setFulfilment(o.v)}
                accessibilityRole="radio"
                accessibilityState={{ selected: fulfilment === o.v }}
                style={[st.choice, fulfilment === o.v && st.choiceActive]}>
                <Ionicons name={o.icon} size={20} color={colors.brand} />
                <Text style={{ fontWeight: '700', color: colors.ink950 }}>{o.t}</Text>
                <Text style={{ fontSize: 12, color: colors.ink500 }}>{o.d}</Text>
              </Pressable>
            ))}
          </View>

          {fulfilment === 'pickup' ? (
            <Banner tone="info">{store.address}. When you get to First Bank, call us for pick-up. We&apos;ll call when your order is ready.</Banner>
          ) : (
            <>
              {addresses.length > 0 && (
                <View style={{ gap: 8 }}>
                  <Text style={s.label}>Deliver to</Text>
                  {[...addresses.map((a) => ({ id: a.id, title: a.fullName + (a.isDefault ? ' · Default' : ''), sub: `${a.line1}, ${a.city}, ${a.state}` })), { id: 'new', title: 'Use a new address', sub: '' }].map((o) => (
                    <Pressable key={o.id} onPress={() => pick(o.id)} accessibilityRole="radio" accessibilityState={{ selected: addressId === o.id }} style={[st.addr, addressId === o.id && st.choiceActive]}>
                      <Ionicons name={addressId === o.id ? 'radio-button-on' : 'radio-button-off'} size={20} color={addressId === o.id ? colors.brand : colors.ink400} />
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontWeight: '700', color: colors.ink950 }}>{o.title}</Text>
                        {o.sub ? <Text style={{ color: colors.ink500, fontSize: 13 }}>{o.sub}</Text> : null}
                      </View>
                    </Pressable>
                  ))}
                </View>
              )}
              {addressId === 'new' && (
                <>
                  <StatePicker value={state} onChange={setState} error={errors.state} />
                  <Field label="City / area" value={city} onChangeText={setCity} error={errors.city} placeholder="e.g. Wuse 2" autoComplete="postal-address-locality" />
                  <Field label="Street address" value={address} onChangeText={setAddress} error={errors.address} placeholder="House number, street, landmark" autoComplete="street-address" />
                  {session && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Text style={{ fontWeight: '600', color: colors.ink950 }}>Save this address to my account</Text>
                      <Switch value={saveAddress} onValueChange={setSaveAddress} trackColor={{ true: colors.brand }} />
                    </View>
                  )}
                </>
              )}
            </>
          )}
          <Field label="Notes (optional)" value={notes} onChangeText={setNotes} multiline placeholder="Delivery instructions, best time to call…" />
        </Section>

        <View style={st.summary}>
          <Text style={s.h2}>Your order</Text>
          {lines.map((l) => (
            <View key={l.variantId} style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
              <Text style={{ flex: 1, color: colors.ink700 }} numberOfLines={2}>
                {l.quantity} × {l.product?.name} <Text style={{ color: colors.ink500 }}>({l.variant?.label})</Text>
              </Text>
              <Text style={{ fontWeight: '700' }}>{naira((l.variant?.price ?? 0) * l.quantity)}</Text>
            </View>
          ))}
          <View style={st.divider} />
          <Row label="Subtotal" value={naira(cart.subtotal)} />
          <Row label="Delivery" value={fulfilment === 'pickup' ? 'Free' : 'Confirmed before dispatch'} />
          <View style={st.divider} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <Text style={{ fontWeight: '700', fontSize: 16 }}>Total</Text>
            <Text style={{ fontFamily: fonts.display, fontSize: 24 }}>{naira(cart.subtotal)}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={[st.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <Button title={`Place order · ${naira(cart.subtotal)}`} onPress={submit} loading={submitting} />
        <Text style={{ textAlign: 'center', color: colors.ink500, fontSize: 12, marginTop: 8 }}>
          {fulfilment === 'pickup' ? 'Pay when you collect at the store' : 'Pay on delivery · we’ll call to confirm first'}
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

function Section({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 14 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: colors.ink950, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: colors.white, fontWeight: '700' }}>{n}</Text>
        </View>
        <Text style={s.h2}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
      <Text style={{ color: colors.ink600 }}>{label}</Text>
      <Text style={{ color: colors.ink950, textAlign: 'right', flexShrink: 1 }}>{value}</Text>
    </View>
  );
}

const st = StyleSheet.create({
  choice: { flex: 1, gap: 4, padding: 14, borderRadius: 16, borderWidth: 1, borderColor: colors.ink200 },
  choiceActive: { borderWidth: 2, borderColor: colors.ink950, backgroundColor: colors.ink50 },
  addr: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 14, borderRadius: 14, borderWidth: 1, borderColor: colors.ink200 },
  summary: { gap: 10, padding: 16, borderRadius: radius.card, backgroundColor: colors.ink50 },
  divider: { height: 1, backgroundColor: colors.ink200, marginVertical: 4 },
  footer: { paddingHorizontal: PAGE, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.ink100, backgroundColor: colors.white },
});
