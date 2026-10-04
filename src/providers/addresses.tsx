import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { friendlyError } from '@/lib/format';
import { watchTable } from '@/lib/realtime';
import { supabase } from '@/lib/supabase';
import { useAuth } from './auth';

// The customer's address book — the same `addresses` rows the website's Account page and checkout use.
// The database keeps exactly one default address (trigger in migration 0003).

export interface Address {
  id: string;
  fullName: string;
  phone: string;
  state: string;
  city: string;
  line1: string;
  notes: string | null;
  isDefault: boolean;
}

export type AddressInput = Omit<Address, 'id' | 'isDefault'> & { isDefault?: boolean };

interface AddressState {
  addresses: Address[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  save: (input: AddressInput, id?: string) => Promise<string | null>;
  remove: (id: string) => Promise<string | null>;
  makeDefault: (id: string) => Promise<string | null>;
}

const AddressContext = createContext<AddressState | null>(null);

const mapRow = (a: Record<string, unknown>): Address => ({
  id: a.id as string,
  fullName: a.full_name as string,
  phone: a.phone as string,
  state: a.state as string,
  city: a.city as string,
  line1: a.line1 as string,
  notes: (a.notes as string) ?? null,
  isDefault: a.is_default as boolean,
});

async function fetchAddresses(): Promise<Address[]> {
  // RLS returns only the signed-in customer's rows.
  const { data, error } = await supabase
    .from('addresses')
    .select('id, full_name, phone, state, city, line1, notes, is_default, created_at')
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapRow);
}

export function AddressProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const userId = session?.user.id ?? null;
  // Keyed by user id so another account's addresses are never shown after switching accounts.
  const [state, setState] = useState<{ uid: string; list: Address[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const addresses = useMemo(() => (state && state.uid === userId ? state.list : []), [state, userId]);
  const loading = Boolean(userId) && state?.uid !== userId && !error;

  const refresh = useCallback(() => {
    if (!userId) return Promise.resolve();
    return fetchAddresses().then(
      (list) => {
        setError(null);
        setState({ uid: userId, list });
      },
      (e) => setError(friendlyError(e, "We couldn't load your addresses.")),
    );
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    fetchAddresses().then(
      (list) => setState({ uid: userId, list }),
      (e) => setError(friendlyError(e, "We couldn't load your addresses.")),
    );
    return watchTable('addresses', `user_id=eq.${userId}`, () => void refresh());
  }, [userId, refresh]);

  const value = useMemo<AddressState>(
    () => ({
      addresses,
      loading,
      error,
      refresh,
      async save(input, id) {
        if (!userId) return 'Please sign in again.';
        const row = {
          user_id: userId,
          full_name: input.fullName.trim(),
          phone: input.phone.replace(/[\s-]/g, ''),
          state: input.state,
          city: input.city.trim(),
          line1: input.line1.trim(),
          notes: input.notes?.trim() || null,
          ...(input.isDefault ? { is_default: true } : {}),
        };
        const { error: err } = id ? await supabase.from('addresses').update(row).eq('id', id) : await supabase.from('addresses').insert(row);
        if (err) return friendlyError(err, "We couldn't save this address. Please try again.");
        await refresh();
        return null;
      },
      async remove(id) {
        const { error: err } = await supabase.from('addresses').delete().eq('id', id);
        if (err) return friendlyError(err, "We couldn't remove this address. Please try again.");
        await refresh();
        return null;
      },
      async makeDefault(id) {
        const { error: err } = await supabase.from('addresses').update({ is_default: true }).eq('id', id);
        if (err) return friendlyError(err, "We couldn't update your default address.");
        await refresh();
        return null;
      },
    }),
    [addresses, loading, error, refresh, userId],
  );

  return <AddressContext.Provider value={value}>{children}</AddressContext.Provider>;
}

export function useAddresses() {
  const ctx = useContext(AddressContext);
  if (!ctx) throw new Error('useAddresses must be used inside <AddressProvider>');
  return ctx;
}
