import * as SecureStore from 'expo-secure-store';

// Stores values in the iOS Keychain / Android Keystore via expo-secure-store.
// SecureStore entries are limited to ~2KB, and a Supabase session is larger, so long values are
// split into chunks: "<key>.n" holds the chunk count, "<key>.0", "<key>.1", … hold the data.

const CHUNK = 1800;
const safe = (key: string) => key.replace(/[^A-Za-z0-9._-]/g, '_'); // SecureStore key charset

export const secureStorage = {
  async getItem(key: string): Promise<string | null> {
    const k = safe(key);
    const n = await SecureStore.getItemAsync(`${k}.n`);
    if (!n) return null;
    const parts = await Promise.all(Array.from({ length: Number(n) }, (_, i) => SecureStore.getItemAsync(`${k}.${i}`)));
    return parts.some((p) => p === null) ? null : parts.join('');
  },
  async setItem(key: string, value: string): Promise<void> {
    const k = safe(key);
    const old = Number((await SecureStore.getItemAsync(`${k}.n`)) ?? 0);
    const chunks = value.match(new RegExp(`[\\s\\S]{1,${CHUNK}}`, 'g')) ?? [''];
    await Promise.all(chunks.map((c, i) => SecureStore.setItemAsync(`${k}.${i}`, c)));
    await SecureStore.setItemAsync(`${k}.n`, String(chunks.length));
    for (let i = chunks.length; i < old; i++) await SecureStore.deleteItemAsync(`${k}.${i}`);
  },
  async removeItem(key: string): Promise<void> {
    const k = safe(key);
    const n = Number((await SecureStore.getItemAsync(`${k}.n`)) ?? 0);
    await Promise.all(Array.from({ length: n }, (_, i) => SecureStore.deleteItemAsync(`${k}.${i}`)));
    await SecureStore.deleteItemAsync(`${k}.n`);
  },
};

/** Small JSON values (guest cart / favourites) kept on-device until the customer signs in. */
export async function readJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await secureStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
export async function writeJson(key: string, value: unknown) {
  try {
    await secureStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}
