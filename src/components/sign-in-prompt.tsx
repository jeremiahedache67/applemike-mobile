import { router } from 'expo-router';
import { View } from 'react-native';

import { Button, EmptyState, type IconName } from './ui';

/** Shown on screens that need an account (orders, addresses…). */
export function SignInPrompt({ icon = 'person-circle-outline', title, body }: { icon?: IconName; title: string; body: string }) {
  return (
    <EmptyState
      icon={icon}
      title={title}
      body={body}
      action={
        <View style={{ gap: 10 }}>
          <Button title="Sign in" onPress={() => router.push('/login')} />
          <Button title="Create an account" variant="outline" onPress={() => router.push('/signup')} />
        </View>
      }
    />
  );
}
