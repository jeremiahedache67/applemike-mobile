import Ionicons from '@expo/vector-icons/Ionicons';
import { router, type Href } from 'expo-router';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '@/components/text';

import { LogoMark } from '@/components/logo';
import { SignInPrompt } from '@/components/sign-in-prompt';
import { s, type IconName } from '@/components/ui';
import { config, store, whatsappLink } from '@/lib/config';
import { useAddresses } from '@/providers/addresses';
import { useAuth } from '@/providers/auth';
import { colors, fonts, PAGE } from '@/theme';

export default function AccountScreen() {
  const { session, profile, email, signOut } = useAuth();
  const { addresses } = useAddresses();

  if (!session) {
    return (
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <SignInPrompt title="Your Apple Mike account" body="Use the same account as the website to see your orders, saved addresses, cart and favourites on every device." />
        <Help inset />
      </ScrollView>
    );
  }

  const name = profile?.fullName || email || 'My account';
  const defaultAddress = addresses.find((a) => a.isDefault);

  return (
    <ScrollView contentContainerStyle={{ padding: PAGE, gap: 22 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <View style={st.avatar}>
          <Text style={{ color: colors.white, fontFamily: fonts.display, fontSize: 22 }}>{name[0]?.toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.h2} numberOfLines={1}>{name}</Text>
          <Text style={{ color: colors.ink500 }} numberOfLines={1}>{email}</Text>
        </View>
      </View>

      <View style={st.group}>
        <Row icon="receipt-outline" label="Your orders" href="/account/orders" />
        <Row icon="person-outline" label="Your details" detail={profile?.phone || 'Add phone number'} href="/account/profile" />
        <Row
          icon="location-outline"
          label="Saved addresses"
          detail={defaultAddress ? `${defaultAddress.line1}, ${defaultAddress.city}` : 'Add an address'}
          href="/account/addresses"
          last
        />
      </View>

      <Help />

      <Pressable
        onPress={() =>
          Alert.alert('Sign out?', 'Your cart and favourites stay saved on your account.', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Sign out', style: 'destructive', onPress: () => void signOut() },
          ])
        }
        accessibilityRole="button"
        style={({ pressed }) => [st.signOut, pressed && { backgroundColor: colors.ink50 }]}>
        <Ionicons name="log-out-outline" size={20} color={colors.brand} />
        <Text style={{ color: colors.brand, fontWeight: '700', fontSize: 15 }}>Sign out</Text>
      </Pressable>
    </ScrollView>
  );
}

function Row({ icon, label, detail, href, last }: { icon: IconName; label: string; detail?: string; href: Href; last?: boolean }) {
  return (
    <Pressable onPress={() => router.push(href)} accessibilityRole="button" style={({ pressed }) => [st.row, !last && st.rowBorder, pressed && { backgroundColor: colors.ink50 }]}>
        <Ionicons name={icon} size={22} color={colors.brand} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ fontWeight: '600', fontSize: 15, color: colors.ink950 }}>{label}</Text>
          {detail ? <Text style={{ color: colors.ink500, fontSize: 13 }} numberOfLines={1}>{detail}</Text> : null}
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.ink400} />
    </Pressable>
  );
}

// inset: add page padding when the parent screen has none (signed-out view).
function Help({ inset }: { inset?: boolean }) {
  return (
    <View style={{ paddingHorizontal: inset ? PAGE : 0, gap: 10 }}>
      <Text style={[s.label, { color: colors.ink500 }]}>NEED HELP?</Text>
      <View style={st.group}>
        <Pressable style={[st.row, st.rowBorder]} onPress={() => Linking.openURL(whatsappLink('Hi Apple Mike, I need help.'))} accessibilityRole="button">
          <Ionicons name="logo-whatsapp" size={22} color={colors.whatsapp} />
          <Text style={{ flex: 1, fontWeight: '600', fontSize: 15 }}>Chat on WhatsApp</Text>
          <Ionicons name="open-outline" size={16} color={colors.ink400} />
        </Pressable>
        <Pressable style={[st.row, st.rowBorder]} onPress={() => Linking.openURL(`tel:${store.phoneE164}`)} accessibilityRole="button">
          <Ionicons name="call-outline" size={22} color={colors.brand} />
          <Text style={{ flex: 1, fontWeight: '600', fontSize: 15 }}>Call {store.phoneDisplay}</Text>
        </Pressable>
        <Pressable style={st.row} onPress={() => Linking.openURL(config.siteUrl)} accessibilityRole="link">
          <LogoMark size={22} />
          <Text style={{ flex: 1, fontWeight: '600', fontSize: 15 }}>Open the website</Text>
          <Ionicons name="open-outline" size={16} color={colors.ink400} />
        </Pressable>
      </View>
      <Text style={{ color: colors.ink400, fontSize: 12, textAlign: 'center', marginTop: 4 }}>{store.address}</Text>
    </View>
  );
}

const st = StyleSheet.create({
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center' },
  group: { borderRadius: 20, borderWidth: 1, borderColor: colors.ink100, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, minHeight: 60, paddingVertical: 10 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.ink100 },
  signOut: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 52, borderRadius: 999, borderWidth: 1, borderColor: colors.ink200 },
});

