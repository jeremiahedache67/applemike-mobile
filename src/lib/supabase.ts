import { createClient } from '@supabase/supabase-js';
import { AppState } from 'react-native';

import { config } from './config';
import { secureStorage } from './secure-storage';

// The same Supabase project (database + accounts) as the Apple Mike website.
// The session is persisted in the device keychain/keystore and refreshed automatically.
export const supabase = createClient(config.supabaseUrl, config.supabaseKey, {
  auth: {
    storage: secureStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    flowType: 'pkce',
  },
});

// Refresh tokens only while the app is in the foreground (recommended by Supabase for React Native).
AppState.addEventListener('change', (state) => {
  if (state === 'active') supabase.auth.startAutoRefresh();
  else supabase.auth.stopAutoRefresh();
});
