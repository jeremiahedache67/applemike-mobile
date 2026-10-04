import { SpaceGrotesk_600SemiBold, SpaceGrotesk_700Bold, useFonts } from '@expo-google-fonts/space-grotesk';
import { DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

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

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({ SpaceGrotesk_600SemiBold, SpaceGrotesk_700Bold });
  if (!fontsLoaded && !fontError) return null;

  return (
    <ThemeProvider value={theme}>
      <AuthProvider>
        <CatalogProvider>
          <CartProvider>
            <FavouritesProvider>
              <AddressProvider>
                <StatusBar style="dark" />
                <AppStack />
              </AddressProvider>
            </FavouritesProvider>
          </CartProvider>
        </CatalogProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

function AppStack() {
  const { ready } = useAuth();
  // Keep the splash screen up until the saved session has been restored (no login flash).
  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);
  if (!ready) return null;

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
