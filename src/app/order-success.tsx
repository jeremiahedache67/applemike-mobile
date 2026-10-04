import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';

import { Button, s } from '@/components/ui';
import { useAuth } from '@/providers/auth';
import { colors, PAGE } from '@/theme';

export default function OrderSuccessScreen() {
  const { orderNumber, email, fulfilment } = useLocalSearchParams<{ orderNumber: string; email: string; fulfilment: string }>();
  const { session } = useAuth();
  return (
    <View style={{ flex: 1, padding: PAGE, justifyContent: 'center', gap: 16 }}>
      <Ionicons name="checkmark-circle" size={72} color={colors.ok} style={{ alignSelf: 'center' }} />
      <Text style={[s.h1, { textAlign: 'center' }]}>Order received — thank you!</Text>
      <Text style={{ textAlign: 'center', color: colors.ink600, fontSize: 16, lineHeight: 23 }}>
        {orderNumber ? <Text style={{ fontWeight: '700', color: colors.ink950 }}>Order {orderNumber}</Text> : 'Your order'} is saved. We&apos;ll call you to confirm, and you&apos;ll pay{' '}
        {fulfilment === 'pickup' ? 'when you collect it at the store' : 'on delivery'}.{email ? ` A confirmation has been sent to ${email}.` : ''}
      </Text>
      <View style={{ gap: 10, marginTop: 12 }}>
        {session && <Button title="View your orders" variant="dark" onPress={() => router.replace('/account/orders')} />}
        <Button title="Continue shopping" variant={session ? 'outline' : 'primary'} onPress={() => router.dismissTo('/')} />
      </View>
    </View>
  );
}
