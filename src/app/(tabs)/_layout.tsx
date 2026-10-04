import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';

import { Text } from '@/components/text';
import { useCart } from '@/providers/cart';
import { useFavourites } from '@/providers/favourites';
import { colors, fonts } from '@/theme';

// Bottom tabs (works in Expo Go on iOS and Android).
export default function TabsLayout() {
  const { count } = useCart();
  const { ids } = useFavourites();
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.brand,
        tabBarInactiveTintColor: colors.ink500,
        tabBarLabel: ({ color, children }) => (
          <Text style={{ color, fontSize: 11, fontWeight: '600' }} numberOfLines={1}>
            {children}
          </Text>
        ),
        headerTitleStyle: { fontFamily: fonts.display, fontSize: 20 },
        headerShadowVisible: false,
        tabBarBadgeStyle: { backgroundColor: colors.brand, fontSize: 11 },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Shop',
          headerShown: false,
          tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'storefront' : 'storefront-outline'} size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="favourites"
        options={{
          title: 'Favourites',
          tabBarBadge: ids.length > 0 ? ids.length : undefined,
          tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'heart' : 'heart-outline'} size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Cart',
          tabBarBadge: count > 0 ? count : undefined,
          tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'bag' : 'bag-outline'} size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: 'Account',
          tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'person' : 'person-outline'} size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
