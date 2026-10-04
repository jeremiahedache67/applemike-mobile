import Ionicons from '@expo/vector-icons/Ionicons';
import { Link, router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, View } from 'react-native';
import { Text } from '@/components/text';

import { SignInPrompt } from '@/components/sign-in-prompt';
import { StatusPill } from '@/components/status-pill';
import { Banner, Button, EmptyState } from '@/components/ui';
import { formatDate, friendlyError, naira } from '@/lib/format';
import { fetchOrders, type OrderSummary } from '@/lib/orders';
import { useAuth } from '@/providers/auth';
import { colors, fonts, PAGE } from '@/theme';

export default function OrdersScreen() {
  const { session } = useAuth();
  const [orders, setOrders] = useState<OrderSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setOrders(await fetchOrders());
      setError(null);
    } catch (e) {
      setError(friendlyError(e, "We couldn't load your orders."));
    }
  }, []);

  // Refresh whenever the screen is opened (orders placed on the website show up here too).
  useFocusEffect(
    useCallback(() => {
      if (session) void load();
    }, [session, load]),
  );

  if (!session) return <SignInPrompt icon="receipt-outline" title="Sign in to see your orders" body="Orders from the website and the app appear together." />;
  if (orders === null && !error) return <ActivityIndicator color={colors.brand} style={{ marginTop: 40 }} />;

  return (
    <FlatList
      data={orders ?? []}
      keyExtractor={(o) => o.id}
      contentContainerStyle={{ padding: PAGE, gap: 10, flexGrow: 1 }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          tintColor={colors.brand}
          colors={[colors.brand]}
          onRefresh={async () => {
            setRefreshing(true);
            await load();
            setRefreshing(false);
          }}
        />
      }
      ListHeaderComponent={error ? <Banner onRetry={load}>{error}</Banner> : null}
      renderItem={({ item: o }) => (
        <Link href={{ pathname: '/account/order/[id]', params: { id: o.id } }} asChild>
          <Pressable accessibilityRole="button" style={({ pressed }) => [{ padding: 16, borderRadius: 18, borderWidth: 1, borderColor: colors.ink100, gap: 8 }, pressed && { backgroundColor: colors.ink50 }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontWeight: '700', fontSize: 15 }}>{o.orderNumber}</Text>
              <Text style={{ fontFamily: fonts.display, fontSize: 17 }}>{naira(o.total)}</Text>
            </View>
            <Text style={{ color: colors.ink500, fontSize: 13 }}>
              {formatDate(o.createdAt)} · {o.itemCount} item{o.itemCount === 1 ? '' : 's'}
            </Text>
            <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
              <StatusPill kind="payment" value={o.paymentStatus} />
              <StatusPill kind="order" value={o.status} />
              <View style={{ flex: 1 }} />
              <Ionicons name="chevron-forward" size={18} color={colors.ink400} />
            </View>
          </Pressable>
        </Link>
      )}
      ListEmptyComponent={
        error ? null : (
          <EmptyState icon="receipt-outline" title="No orders yet" body="When you buy something, you'll be able to track it here." action={<Button title="Start shopping" onPress={() => router.navigate('/')} />} />
        )
      }
    />
  );
}
