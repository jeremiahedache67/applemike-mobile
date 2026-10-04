import { DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { FontsProvider, useFontsReady } from '@/components/text';
import { AddressProvider } from '@/providers/addresses';
import { AuthProvider, useAuth } from '@/providers/auth';
import { CartProvider } from '@/providers/cart';
import { CatalogProvider } from '@/providers/catalog';
import { FavouritesProvider } from '@/providers/favourites';
import { colors, fonts } from '@/theme';

SplashScreen.preventAutoHideAsync();

const theme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, primary: colors.brand, background: colors.white, card: colors.white, text: colors.ink950, border: colors.ink100 },
};

// Expo Router requires the root layout to always render its navigator (never return null),
// otherwise screens can mount outside these providers. The splash screen stays up instead
// until fonts and the saved sign-in are ready (see SplashController).
export default function RootLayout() {
  return (
    <ThemeProvider value={theme}>
      <FontsProvider>
      <AuthProvider>
        <CatalogProvider>
          <CartProvider>
            <FavouritesProvider>
              <AddressProvider>
                <StatusBar style="dark" />
                <SplashController />
                <AppStack />
              </AddressProvider>
            </FavouritesProvider>
          </CartProvider>
        </CatalogProvider>
      </AuthProvider>
      </FontsProvider>
    </ThemeProvider>
  );
}

function SplashController() {
  const fontsReady = useFontsReady();
  const { ready } = useAuth();
  // Hide the splash only once fonts are loaded and the saved session is restored (no flash of the login state).
  useEffect(() => {
    if (fontsReady && ready) void SplashScreen.hideAsync();
  }, [fontsReady, ready]);
  return null;
}

function AppStack() {
  return (
    <Stack
      screenOptions={{
        headerTintColor: colors.ink950,
        headerTitleStyle: { fontFamily: fonts.display },
        headerBackButtonDisplayMode: 'minimal',
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.white },
      }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="auth-callback" options={{ headerShown: false }} />
      <Stack.Screen name="product/[slug]" options={{ title: '' }} />
      <Stack.Screen name="checkout" options={{ title: 'Checkout' }} />
      <Stack.Screen name="order-success" options={{ title: 'Order placed', headerBackVisible: false, gestureEnabled: false }} />
      <Stack.Screen name="login" options={{ title: 'Sign in', presentation: 'modal' }} />
      <Stack.Screen name="signup" options={{ title: 'Create account', presentation: 'modal' }} />
      <Stack.Screen name="forgot-password" options={{ title: 'Reset password', presentation: 'modal' }} />
      <Stack.Screen name="account/profile" options={{ title: 'Your details' }} />
      <Stack.Screen name="account/addresses" options={{ title: 'Saved addresses' }} />
      <Stack.Screen name="account/address" options={{ title: 'Address', presentation: 'modal' }} />
      <Stack.Screen name="account/orders" options={{ title: 'Your orders' }} />
      <Stack.Screen name="account/order/[id]" options={{ title: 'Order' }} />
    </Stack>
  );
}
