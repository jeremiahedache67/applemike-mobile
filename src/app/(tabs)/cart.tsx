import Ionicons from '@expo/vector-icons/Ionicons';
import { Link, router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ProductImage } from '@/components/product-image';
import { Banner, Button, EmptyState, QtyStepper } from '@/components/ui';
import { naira } from '@/lib/format';
import { useAuth } from '@/providers/auth';
import { useCart, type CartLine } from '@/providers/cart';
import { useCatalog } from '@/providers/catalog';
import { colors, fonts, PAGE, radius } from '@/theme';

export default function CartScreen() {
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const cart = useCart();
  const { refresh: refreshCatalog } = useCatalog();
  const [refreshing, setRefreshing] = useState(false);

  // Always show the latest cart from the database when this tab is opened.
  const { refresh } = cart;
  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([cart.refresh(), refreshCatalog()]);
    setRefreshing(false);
  };

  const unavailable = cart.lines.filter((l) => l.unavailable);

  if (cart.loading && cart.lines.length === 0) {
    return (
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <ActivityIndicator color={colors.brand} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={cart.lines}
        keyExtractor={(l) => l.variantId}
        contentContainerStyle={{ padding: PAGE, gap: 14, flexGrow: 1 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand} colors={[colors.brand]} />}
        ListHeaderComponent={
          <View style={{ gap: 10 }}>
            {cart.error && <Banner onRetry={cart.refresh}>{cart.error}</Banner>}
            {!session && cart.lines.length > 0 && (
              <Banner tone="info">Sign in to keep this cart on your account and see it on the website too.</Banner>
            )}
            {unavailable.length > 0 && <Banner>{unavailable.length === 1 ? 'One item is' : `${unavailable.length} items are`} no longer available and won&apos;t be included in your order.</Banner>}
          </View>
        }
        renderItem={({ item }) => <Line line={item} />}
        ListEmptyComponent={
          <EmptyState
            icon="bag-outline"
            title="Your cart is empty"
            body={session ? 'Anything you add on the website or in the app shows up here.' : 'Find your next phone or laptop — fresh deals land every week.'}
            action={<Button title="Start shopping" onPress={() => router.navigate('/')} />}
          />
        }
      />
      {cart.count > 0 && (
        <View style={[st.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.ink500, fontSize: 13 }}>Subtotal · {cart.count} item{cart.count === 1 ? '' : 's'}</Text>
            <Text style={{ fontFamily: fonts.display, fontSize: 22, color: colors.ink950 }}>{naira(cart.subtotal)}</Text>
          </View>
          <Button title="Checkout" icon="lock-closed" style={{ flex: 1 }} onPress={() => router.push('/checkout')} />
        </View>
      )}
    </View>
  );
}

function Line({ line }: { line: CartLine }) {
  const cart = useCart();
  const busy = cart.pending.has(line.variantId);
  const name = line.product?.name ?? 'Item no longer available';

  const run = async (fn: () => Promise<string | null>) => {
    const error = await fn();
    if (error) Alert.alert("Couldn't update your cart", error);
  };

  return (
    <View style={[st.line, line.unavailable && { opacity: 0.6 }]}>
      <ProductImage src={line.product?.images[0]} name={name} style={st.thumb} />
      <View style={{ flex: 1, minWidth: 0 }}>
        {line.product ? (
          <Link href={{ pathname: '/product/[slug]', params: { slug: line.product.slug } }}>
            <Text style={st.name} numberOfLines={2}>{name}</Text>
          </Link>
        ) : (
          <Text style={st.name}>{name}</Text>
        )}
        <Text style={{ color: colors.ink500, fontSize: 13, marginTop: 2 }}>
          {line.unavailable ? 'Sold out' : `${line.variant?.label} · ${naira(line.variant?.price ?? 0)}`}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
          {line.unavailable ? (
            <View />
          ) : line.maxQty > 1 ? (
            <QtyStepper value={line.quantity} max={line.maxQty} disabled={busy} onChange={(n) => run(() => cart.setQuantity(line.variantId, n))} />
          ) : (
            <Text style={{ color: colors.ink500, fontSize: 13 }}>Qty 1</Text>
          )}
          <Pressable
            onPress={() => run(() => cart.remove(line.variantId))}
            disabled={busy}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={`Remove ${name} from cart`}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 4, padding: 6 }}>
            {busy ? <ActivityIndicator size="small" color={colors.ink500} /> : <Ionicons name="trash-outline" size={18} color={colors.ink500} />}
            <Text style={{ color: colors.ink500, fontWeight: '600' }}>Remove</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  line: { flexDirection: 'row', gap: 12, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: colors.ink100 },
  thumb: { width: 92, height: 92, borderRadius: 16 },
  name: { fontFamily: fonts.displaySemi, fontSize: 15, color: colors.ink950 },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: PAGE,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.ink100,
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.card,
    borderTopRightRadius: radius.card,
  },
});
