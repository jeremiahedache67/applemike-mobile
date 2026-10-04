import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { completeGoogleSignIn } from '@/lib/google-auth';
import { colors } from '@/theme';

// Where Google sign-in redirects back to. On some Android devices the redirect opens this route
// directly instead of returning to the in-app browser call, so finish sign-in here too.
export default function AuthCallbackScreen() {
  const url = Linking.useLinkingURL();

  useEffect(() => {
    if (!url) return;
    completeGoogleSignIn(url).finally(() => {
      if (router.canGoBack()) router.back();
      else router.replace('/account');
    });
  }, [url]);

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator color={colors.brand} />
    </View>
  );
}
