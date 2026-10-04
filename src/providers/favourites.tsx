import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { friendlyError } from '@/lib/format';
import { watchTable } from '@/lib/realtime';
import { readJson, writeJson } from '@/lib/secure-storage';
import { supabase } from '@/lib/supabase';
import { useAuth } from './auth';

// Favourites = wishlists / wishlist_items — the same rows behind the website's wishlist.
// Guests keep them on the device until they sign in.

const GUEST_KEY = 'am.favourites.guest';

interface FavouritesState {
  ids: string[];
  has: (productId: string) => boolean;
  toggle: (productId: string) => Promise<{ added: boolean; error: string | null }>;
  refresh: () => Promise<void>;
}

const FavouritesContext = createContext<FavouritesState | null>(null);

export function FavouritesProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const userId = session?.user.id ?? null;
  const [ids, setIds] = useState<string[]>([]);
  const idsRef = useRef(ids);
  /** Updates state and the ref together, so rapid taps always build on the latest value. */
  const commit = useCallback((next: string[]) => {
    idsRef.current = next;
    setIds(next);
  }, []);
  const wishlistId = useRef<string | null>(null);

  const fetchIds = useCallback(async () => {
    if (!wishlistId.current) return;
    const { data, error } = await supabase
      .from('wishlist_items')
      .select('product_id')
      .eq('wishlist_id', wishlistId.current)
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    commit((data ?? []).map((r) => r.product_id));
  }, [commit]);

  const refresh = useCallback(async () => {
    try {
      await fetchIds();
    } catch {
      /* keep what we have; the next refresh will retry */
    }
  }, [fetchIds]);

  useEffect(() => {
    let cancelled = false;
    let unwatch: (() => void) | undefined;
    wishlistId.current = null;
    (async () => {
      const guest = await readJson<string[]>(GUEST_KEY, []);
      if (!userId) {
        if (!cancelled) commit(guest);
        return;
      }
      const { data, error } = await supabase.from('wishlists').upsert({ user_id: userId }, { onConflict: 'user_id' }).select('id').single();
      if (error || cancelled) return;
      wishlistId.current = data.id;
      if (guest.length) {
        const { error: mergeErr } = await supabase
          .from('wishlist_items')
          .upsert(guest.map((product_id) => ({ wishlist_id: data.id, product_id })), { onConflict: 'wishlist_id,product_id', ignoreDuplicates: true });
        if (!mergeErr) await writeJson(GUEST_KEY, []);
      }
      await refresh();
      unwatch = watchTable('wishlist_items', `wishlist_id=eq.${data.id}`, () => void refresh());
    })();
    return () => {
      cancelled = true;
      unwatch?.();
    };
  }, [userId, refresh, commit]);

  const value = useMemo<FavouritesState>(
    () => ({
      ids,
      has: (id) => ids.includes(id),
      refresh,
      async toggle(productId) {
        const previous = idsRef.current;
        const added = !previous.includes(productId);
        const next = added ? [productId, ...previous] : previous.filter((x) => x !== productId);
        commit(next);
        if (!wishlistId.current) {
          await writeJson(GUEST_KEY, next);
          return { added, error: null };
        }
        const { error } = added
          ? await supabase.from('wishlist_items').upsert({ wishlist_id: wishlistId.current, product_id: productId }, { onConflict: 'wishlist_id,product_id', ignoreDuplicates: true })
          : await supabase.from('wishlist_items').delete().eq('wishlist_id', wishlistId.current).eq('product_id', productId);
        if (error) {
          commit(previous);
          return { added, error: friendlyError(error, "We couldn't update your favourites. Please try again.") };
        }
        return { added, error: null };
      },
    }),
    [ids, refresh, commit],
  );

  return <FavouritesContext.Provider value={value}>{children}</FavouritesContext.Provider>;
}

export function useFavourites() {
  const ctx = useContext(FavouritesContext);
  if (!ctx) throw new Error('useFavourites must be used inside <FavouritesProvider>');
  return ctx;
}
