import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { SignInPrompt } from '@/components/sign-in-prompt';
import { Banner, Button, EmptyState, Pill } from '@/components/ui';
import { useAddresses, type Address } from '@/providers/addresses';
import { useAuth } from '@/providers/auth';
import { colors, PAGE, radius } from '@/theme';

export default function AddressesScreen() {
  const { session } = useAuth();
  const { addresses, loading, error, refresh } = useAddresses();
  const [refreshing, setRefreshing] = useState(false);

  if (!session) return <SignInPrompt icon="location-outline" title="Sign in to manage addresses" body="Saved addresses are shared with the website's checkout." />;

  return (
    <FlatList
      data={addresses}
      keyExtractor={(a) => a.id}
      contentContainerStyle={{ padding: PAGE, gap: 12, flexGrow: 1 }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          tintColor={colors.brand}
          colors={[colors.brand]}
          onRefresh={async () => {
            setRefreshing(true);
            await refresh();
            setRefreshing(false);
          }}
        />
      }
      ListHeaderComponent={error ? <Banner onRetry={refresh}>{error}</Banner> : null}
      renderItem={({ item }) => <AddressCard address={item} />}
      ListEmptyComponent={
        loading ? (
          <ActivityIndicator color={colors.brand} style={{ marginTop: 40 }} />
        ) : (
          <EmptyState icon="location-outline" title="No saved addresses" body="Save an address for faster checkout in the app and on the website." />
        )
      }
      ListFooterComponent={<Button title="Add address" icon="add" variant="dark" style={{ marginTop: 8 }} onPress={() => router.push('/account/address')} />}
    />
  );
}

function AddressCard({ address: a }: { address: Address }) {
  const { remove, makeDefault } = useAddresses();
  const [busy, setBusy] = useState(false);

  const run = async (fn: () => Promise<string | null>) => {
    setBusy(true);
    const err = await fn();
    setBusy(false);
    if (err) Alert.alert('Addresses', err);
  };

  return (
    <View style={[st.card, a.isDefault && { borderWidth: 2, borderColor: colors.ink950 }]}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10 }}>
        <Text style={{ fontWeight: '700', fontSize: 15, flex: 1 }}>{a.fullName}</Text>
        {a.isDefault && <Pill tone="brand">Default</Pill>}
      </View>
      <Text style={{ color: colors.ink600, marginTop: 4, lineHeight: 20 }}>
        {a.line1}, {a.city}, {a.state}
        {'\n'}
        {a.phone}
      </Text>
      {a.notes ? <Text style={{ color: colors.ink500, fontStyle: 'italic', marginTop: 4 }}>{a.notes}</Text> : null}
      <View style={st.actions}>
        <Action icon="create-outline" label="Edit" onPress={() => router.push({ pathname: '/account/address', params: { id: a.id } })} disabled={busy} />
        {!a.isDefault && <Action icon="star-outline" label="Make default" onPress={() => run(() => makeDefault(a.id))} disabled={busy} />}
        <Action
          icon="trash-outline"
          label="Remove"
          danger
          disabled={busy}
          onPress={() =>
            Alert.alert('Remove this address?', `${a.line1}, ${a.city}`, [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Remove', style: 'destructive', onPress: () => run(() => remove(a.id)) },
            ])
          }
        />
      </View>
    </View>
  );
}

function Action({ icon, label, onPress, danger, disabled }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void; danger?: boolean; disabled?: boolean }) {
  const color = danger ? colors.brand : colors.ink950;
  return (
    <Pressable onPress={onPress} disabled={disabled} accessibilityRole="button" hitSlop={6} style={({ pressed }) => [st.action, pressed && { backgroundColor: colors.ink50 }, disabled && { opacity: 0.5 }]}>
      <Ionicons name={icon} size={16} color={color} />
      <Text style={{ color, fontWeight: '600', fontSize: 13 }}>{label}</Text>
    </Pressable>
  );
}

const st = StyleSheet.create({
  card: { padding: 16, borderRadius: radius.card, borderWidth: 1, borderColor: colors.ink200 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.ink100 },
  action: { flexDirection: 'row', alignItems: 'center', gap: 5, height: 36, paddingHorizontal: 12, borderRadius: 999, borderWidth: 1, borderColor: colors.ink200 },
});
