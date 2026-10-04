import Ionicons from '@expo/vector-icons/Ionicons';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Linking, ScrollView, View } from 'react-native';
import { Text } from '@/components/text';

import { StatusPill } from '@/components/status-pill';
import { Banner, Button, EmptyState, s } from '@/components/ui';
import { store, whatsappLink } from '@/lib/config';
import { formatDate, friendlyError, naira } from '@/lib/format';
import { fetchOrder, orderStatusLabel, type OrderDetail } from '@/lib/orders';
import { colors, fonts, PAGE, radius } from '@/theme';

const STEPS = ['processing', 'shipped', 'delivered'] as const;

export default function OrderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [order, setOrder] = useState<OrderDetail | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setOrder(await fetchOrder(id));
      setError(null);
    } catch (e) {
      setError(friendlyError(e, "We couldn't load this order."));
    }
  }, [id]);

  useEffect(() => {
    fetchOrder(id).then(
      (o) => {
        setOrder(o);
        setError(null);
      },
      (e) => setError(friendlyError(e, "We couldn't load this order.")),
    );
  }, [id]);

  if (error) return <View style={{ padding: PAGE }}><Banner onRetry={load}>{error}</Banner></View>;
  if (order === undefined) return <ActivityIndicator color={colors.brand} style={{ marginTop: 40 }} />;
  if (order === null) return <EmptyState icon="receipt-outline" title="Order not found" />;

  const reached = STEPS.indexOf(order.status as (typeof STEPS)[number]);
  const active = order.status !== 'cancelled' && order.status !== 'refunded' && (order.paymentStatus === 'paid' || order.paymentStatus === 'unpaid');

  return (
    <ScrollView contentContainerStyle={{ padding: PAGE, gap: 18 }}>
      <Stack.Screen options={{ title: order.orderNumber }} />
      <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
        <StatusPill kind="payment" value={order.paymentStatus} />
        <StatusPill kind="order" value={order.status} />
        <Text style={{ color: colors.ink500, marginLeft: 4 }}>{formatDate(order.createdAt)}</Text>
      </View>

      {active && (
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {STEPS.map((step, i) => (
            <View key={step} style={{ flex: 1, gap: 6 }}>
              <View style={{ height: 6, borderRadius: 3, backgroundColor: reached >= i ? colors.brand : colors.ink100 }} />
              <Text style={{ fontSize: 12, fontWeight: '600', color: reached >= i ? colors.ink950 : colors.ink400 }}>{orderStatusLabel[step]}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={{ borderTopWidth: 1, borderTopColor: colors.ink100 }}>
        {order.items.map((i, idx) => (
          <View key={idx} style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.ink100 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: fonts.displaySemi, fontSize: 15 }}>{i.name}</Text>
              <Text style={{ color: colors.ink500, fontSize: 13 }}>
                {i.label} · Qty {i.quantity} × {naira(i.unitPrice)}
              </Text>
            </View>
            <Text style={{ fontWeight: '700' }}>{naira(i.lineTotal)}</Text>
          </View>
        ))}
      </View>

      <View style={{ flexDirection: 'row', gap: 10, padding: 16, borderRadius: radius.card, backgroundColor: colors.ink50 }}>
        <Ionicons name={order.fulfilment === 'pickup' ? 'location-outline' : 'car-outline'} size={20} color={colors.brand} />
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={{ fontWeight: '700' }}>{order.fulfilment === 'pickup' ? 'Store pick-up' : 'Delivery to'}</Text>
          <Text style={{ color: colors.ink600, lineHeight: 20 }}>
            {order.fulfilment === 'pickup'
              ? `${store.address}. When you get to First Bank, call ${store.phoneDisplay}.`
              : `${order.fullName} · ${order.phone}\n${order.deliveryAddress}, ${order.deliveryCity}, ${order.deliveryState}`}
          </Text>
          {order.deliveryNotes ? <Text style={{ color: colors.ink500, fontStyle: 'italic' }}>{order.deliveryNotes}</Text> : null}
          {order.fulfilment === 'delivery' && order.deliveryFee == null && (
            <Text style={{ color: colors.amber, marginTop: 4 }}>We&apos;ll call you to confirm the delivery fee before dispatch.</Text>
          )}
        </View>
      </View>

      <View style={{ gap: 8 }}>
        <Line label="Subtotal" value={naira(order.subtotal)} />
        <Line label="Delivery" value={order.deliveryFee == null ? 'To be confirmed' : order.deliveryFee === 0 ? 'Free' : naira(order.deliveryFee)} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 4 }}>
          <Text style={s.h2}>Total</Text>
          <Text style={{ fontFamily: fonts.display, fontSize: 24 }}>{naira(order.total)}</Text>
        </View>
      </View>

      <Button title="Ask about this order" variant="outline" icon="logo-whatsapp" onPress={() => Linking.openURL(whatsappLink(`Hi Apple Mike, I have a question about order ${order.orderNumber}.`))} />
    </ScrollView>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <Text style={{ color: colors.ink600 }}>{label}</Text>
      <Text>{value}</Text>
    </View>
  );
}
