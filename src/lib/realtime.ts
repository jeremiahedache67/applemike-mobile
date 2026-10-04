import { AppState } from 'react-native';

import { supabase } from './supabase';

/**
 * Calls `onChange` (debounced) whenever rows matching `filter` change in `table` — e.g. when the
 * customer edits their cart on the website — and whenever the app returns to the foreground,
 * as a fallback if a live event was missed. Returns an unsubscribe function.
 */
export function watchTable(table: string, filter: string, onChange: () => void) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const fire = () => {
    clearTimeout(timer);
    timer = setTimeout(onChange, 400);
  };
  const channel = supabase
    .channel(`${table}:${filter}`)
    .on('postgres_changes', { event: '*', schema: 'public', table, filter }, fire)
    .subscribe();
  const appState = AppState.addEventListener('change', (s) => {
    if (s === 'active') fire();
  });
  return () => {
    clearTimeout(timer);
    appState.remove();
    void supabase.removeChannel(channel);
  };
}
