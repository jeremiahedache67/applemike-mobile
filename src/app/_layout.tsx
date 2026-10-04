import { DefaultTheme, Stack, ThemeProvider, type ErrorBoundaryProps } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';

import { installCrashReporter, showLastCrash } from '@/lib/crash-report';
import { FontsProvider, useFontsReady } from '@/components/text';
import { AddressProvider } from '@/providers/addresses';
import { AuthProvider, useAuth } from '@/providers/auth';
import { CartProvider } from '@/providers/cart';
import { CatalogProvider } from '@/providers/catalog';
import { FavouritesProvider } from '@/providers/favourites';
import { colors, fonts } from '@/theme';

SplashScreen.preventAutoHideAsync();
installCrashReporter();

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
    if (fontsReady && ready) {
      void SplashScreen.hideAsync();
      void showLastCrash();
    }
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

// Shown instead of closing the app if a screen fails to render. Uses plain React Native views
// because the providers above may be what failed.
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  useEffect(() => {
    void SplashScreen.hideAsync();
  }, []);
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 14, backgroundColor: colors.white }}>
      <Text style={{ fontSize: 20, fontWeight: '700', color: colors.ink950, textAlign: 'center' }}>Something went wrong</Text>
      <Text style={{ color: colors.ink500, textAlign: 'center' }}>Please try again. If this keeps happening, send a screenshot of this screen to Apple Mike.</Text>
      <Text style={{ color: colors.ink400, fontSize: 12, textAlign: 'center' }} selectable>
        {error.name}: {error.message}
      </Text>
      <Pressable onPress={retry} accessibilityRole="button" style={{ backgroundColor: colors.brand, borderRadius: 999, paddingHorizontal: 28, height: 50, justifyContent: 'center' }}>
        <Text style={{ color: colors.white, fontWeight: '700', fontSize: 16 }}>Try again</Text>
      </Pressable>
    </View>
  );
}
