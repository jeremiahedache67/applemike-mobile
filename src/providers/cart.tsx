import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import type { Product, Variant } from '@/lib/catalog';
import { friendlyError } from '@/lib/format';
import { watchTable } from '@/lib/realtime';
import { readJson, writeJson } from '@/lib/secure-storage';
import { supabase } from '@/lib/supabase';
import { useAuth } from './auth';
import { useCatalog } from './catalog';

// Signed in: the cart IS the database rows in carts / cart_items — the same rows the website
// reads and writes — so it's identical on web and app. Remote changes arrive live (Realtime) and
// are re-fetched whenever the app returns to the foreground.
// Guest: kept on the device and merged into the account cart on sign-in.

export const MAX_QTY = 20;
const GUEST_KEY = 'am.cart.guest';

type Item = { variantId: string; quantity: number };

export interface CartLine {
  variantId: string;
  quantity: number;
  product: Product | null;
  variant: Variant | null;
  /** Can't be bought any more (sold out, removed, or option hidden). */
  unavailable: boolean;
  maxQty: number;
}

interface CartState {
  lines: CartLine[];
  count: number;
  subtotal: number;
  loading: boolean;
  error: string | null;
  /** Variant ids with a save in flight — used to disable buttons and prevent double taps. */
  pending: Set<string>;
  add: (variantId: string, quantity?: number) => Promise<string | null>;
  setQuantity: (variantId: string, quantity: number) => Promise<string | null>;
  remove: (variantId: string) => Promise<string | null>;
  clear: () => Promise<void>;
  refresh: () => Promise<void>;
}

const CartContext = createContext<CartState | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const { byVariant } = useCatalog();
  const userId = session?.user.id ?? null;

  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<Set<string>>(new Set());
  const cartId = useRef<string | null>(null);
  const itemsRef = useRef(items);
  /** Updates state and the ref together, so rapid taps always build on the latest value. */
  const commit = useCallback((next: Item[]) => {
    itemsRef.current = next;
    setItems(next);
  }, []);

  const fetchItems = useCallback(async () => {
    if (!cartId.current) return;
    const { data, error: err } = await supabase.from('cart_items').select('variant_id, quantity').eq('cart_id', cartId.current).order('created_at');
    if (err) throw new Error(err.message);
    commit((data ?? []).map((r) => ({ variantId: r.variant_id, quantity: r.quantity })));
  }, [commit]);

  const refresh = useCallback(async () => {
    if (!cartId.current) return;
    try {
      await fetchItems();
      setError(null);
    } catch (e) {
      setError(friendlyError(e, "We couldn't refresh your cart. Pull down to try again."));
    }
  }, [fetchItems]);

  // Attach to the account cart on sign-in (merging any guest items); fall back to the guest cart on sign-out.
  useEffect(() => {
    let cancelled = false;
    let unwatch: (() => void) | undefined;
    cartId.current = null;

    (async () => {
      setLoading(true);
      if (!userId) {
        const guest = await readJson<Item[]>(GUEST_KEY, []);
        if (!cancelled) {
          commit(guest);
          setLoading(false);
        }
        return;
      }
      try {
        const { data: cart, error: cartErr } = await supabase.from('carts').upsert({ user_id: userId }, { onConflict: 'user_id' }).select('id').single();
        if (cartErr) throw new Error(cartErr.message);
        if (cancelled) return;
        cartId.current = cart.id;

        const guest = await readJson<Item[]>(GUEST_KEY, []);
        if (guest.length) {
          const { data: existing } = await supabase.from('cart_items').select('variant_id, quantity').eq('cart_id', cart.id);
          const current = new Map((existing ?? []).map((r) => [r.variant_id as string, r.quantity as number]));
          const rows = guest.map((g) => ({ cart_id: cart.id, variant_id: g.variantId, quantity: Math.min(MAX_QTY, Math.max(current.get(g.variantId) ?? 0, g.quantity)) }));
          const { error: mergeErr } = await supabase.from('cart_items').upsert(rows, { onConflict: 'cart_id,variant_id' });
          if (!mergeErr) await writeJson(GUEST_KEY, []);
        }
        await fetchItems();
        setError(null);
        unwatch = watchTable('cart_items', `cart_id=eq.${cart.id}`, () => void refresh());
      } catch (e) {
        if (!cancelled) setError(friendlyError(e, "We couldn't load your cart. Pull down to try again."));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      unwatch?.();
    };
  }, [userId, fetchItems, refresh, commit]);

  const maxFor = useCallback(
    (variantId: string) => {
      const hit = byVariant.get(variantId);
      const stock = hit ? hit.product.variants[hit.variantIndex].stock : MAX_QTY;
      return Math.max(1, Math.min(stock, MAX_QTY));
    },
    [byVariant],
  );

  /** Shows the change immediately, saves it to the account cart, and reverts if the save fails. */
  const mutate = useCallback(
    async (variantId: string, next: Item[], write: (cid: string) => PromiseLike<{ error: { message: string } | null }>) => {
      const previous = itemsRef.current;
      commit(next);
      if (!cartId.current) {
        await writeJson(GUEST_KEY, next);
        return null;
      }
      setPending((s) => new Set(s).add(variantId));
      try {
        const { error: err } = await write(cartId.current);
        if (err) throw new Error(err.message);
        return null;
      } catch (e) {
        commit(previous);
        return friendlyError(e, "We couldn't update your cart. Please try again.");
      } finally {
        setPending((s) => {
          const n = new Set(s);
          n.delete(variantId);
          return n;
        });
      }
    },
    [commit],
  );

  const value = useMemo<CartState>(() => {
    const lines: CartLine[] = items.map((i) => {
      const hit = byVariant.get(i.variantId);
      const product = hit?.product ?? null;
      const variant = hit ? hit.product.variants[hit.variantIndex] : null;
      const unavailable = !product || !variant || !variant.active || product.status !== 'active' || variant.stock <= 0;
      return { variantId: i.variantId, quantity: i.quantity, product, variant, unavailable, maxQty: maxFor(i.variantId) };
    });
    const live = lines.filter((l) => !l.unavailable);
    return {
      lines,
      count: live.reduce((n, l) => n + l.quantity, 0),
      subtotal: live.reduce((n, l) => n + (l.variant?.price ?? 0) * l.quantity, 0),
      loading,
      error,
      pending,
      refresh,
      add(variantId, quantity = 1) {
        const cur = itemsRef.current;
        const existing = cur.find((i) => i.variantId === variantId);
        const qty = Math.min(maxFor(variantId), (existing?.quantity ?? 0) + quantity);
        const next = existing ? cur.map((i) => (i.variantId === variantId ? { ...i, quantity: qty } : i)) : [...cur, { variantId, quantity: qty }];
        return mutate(variantId, next, (cid) =>
          supabase.from('cart_items').upsert({ cart_id: cid, variant_id: variantId, quantity: qty }, { onConflict: 'cart_id,variant_id' }),
        );
      },
      setQuantity(variantId, quantity) {
        const qty = Math.max(1, Math.min(maxFor(variantId), quantity));
        const next = itemsRef.current.map((i) => (i.variantId === variantId ? { ...i, quantity: qty } : i));
        return mutate(variantId, next, (cid) => supabase.from('cart_items').update({ quantity: qty }).eq('cart_id', cid).eq('variant_id', variantId));
      },
      remove(variantId) {
        const next = itemsRef.current.filter((i) => i.variantId !== variantId);
        return mutate(variantId, next, (cid) => supabase.from('cart_items').delete().eq('cart_id', cid).eq('variant_id', variantId));
      },
      async clear() {
        await mutate('*', [], (cid) => supabase.from('cart_items').delete().eq('cart_id', cid));
      },
    };
  }, [items, byVariant, loading, error, pending, refresh, mutate, maxFor]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>');
  return ctx;
}
