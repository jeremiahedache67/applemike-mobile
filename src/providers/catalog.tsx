import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { fetchCatalog, type Category, type Product } from '@/lib/catalog';
import { friendlyError } from '@/lib/format';

interface CatalogState {
  products: Product[];
  categories: Category[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  byId: Map<string, Product>;
  bySlug: Map<string, Product>;
  byVariant: Map<string, { product: Product; variantIndex: number }>;
}

const CatalogContext = createContext<CatalogState | null>(null);
const STALE_MS = 60_000;

/** Products, prices and stock always come from the database (never hard-coded). */
export function CatalogProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loadedAt = useRef(0);

  const apply = useCallback((data: Awaited<ReturnType<typeof fetchCatalog>>) => {
    setProducts(data.products);
    setCategories(data.categories);
    setError(null);
    setLoading(false);
    loadedAt.current = Date.now();
  }, []);
  const fail = useCallback((e: unknown) => {
    setError(friendlyError(e, "We couldn't load products. Pull down to try again."));
    setLoading(false);
  }, []);
  const refresh = useCallback(() => fetchCatalog().then(apply, fail), [apply, fail]);

  useEffect(() => {
    fetchCatalog().then(apply, fail);
    // Re-check prices and stock when the app comes back after a while.
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active' && Date.now() - loadedAt.current > STALE_MS) void refresh();
    });
    return () => sub.remove();
  }, [apply, fail, refresh]);

  const value = useMemo(() => {
    const byId = new Map<string, Product>();
    const bySlug = new Map<string, Product>();
    const byVariant = new Map<string, { product: Product; variantIndex: number }>();
    for (const p of products) {
      byId.set(p.id, p);
      bySlug.set(p.slug, p);
      p.variants.forEach((v, i) => byVariant.set(v.id, { product: p, variantIndex: i }));
    }
    return { products, categories, loading, error, refresh, byId, bySlug, byVariant };
  }, [products, categories, loading, error, refresh]);

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export function useCatalog() {
  const ctx = useContext(CatalogContext);
  if (!ctx) throw new Error('useCatalog must be used inside <CatalogProvider>');
  return ctx;
}
