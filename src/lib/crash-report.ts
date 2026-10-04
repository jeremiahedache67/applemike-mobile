import * as SecureStore from 'expo-secure-store';
import { Alert } from 'react-native';

// In installed builds an uncaught JavaScript error closes the app with no explanation. This keeps
// a short note of the last fatal error on the device and shows it on the next launch, so a crash
// can be reported (screenshot) and fixed. Nothing is sent anywhere.

const KEY = 'am.lastCrash';

type GlobalHandler = (error: unknown, isFatal?: boolean) => void;
declare const ErrorUtils: { getGlobalHandler(): GlobalHandler; setGlobalHandler(h: GlobalHandler): void } | undefined;

export function installCrashReporter() {
  if (typeof ErrorUtils === 'undefined') return;
  const previous = ErrorUtils.getGlobalHandler();
  ErrorUtils.setGlobalHandler((error, isFatal) => {
    if (isFatal) {
      try {
        const e = error instanceof Error ? error : new Error(String(error));
        const where = (e.stack ?? '').split('\n').slice(0, 4).join('\n');
        SecureStore.setItem(KEY, `${e.name}: ${e.message}\n${where}`.slice(0, 1500));
      } catch {
        // Never let reporting get in the way of the original error.
      }
    }
    previous(error, isFatal);
  });
}

export async function showLastCrash() {
  try {
    const report = await SecureStore.getItemAsync(KEY);
    if (!report) return;
    await SecureStore.deleteItemAsync(KEY);
    Alert.alert('Sorry — the app closed unexpectedly last time', `Please send a screenshot of this to Apple Mike so we can fix it.\n\n${report}`);
  } catch {
    // Ignore — this is only a diagnostic aid.
  }
}
