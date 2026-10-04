import { withRetry } from './format';
import { supabase } from './supabase';

// Mirrors the website's product model and catalogue query
// (applemike-store/src/lib/types.ts and src/lib/data/catalog-db.ts).

export type Condition = 'brand-new' | 'open-box' | 'uk-used' | 'used';

export interface Variant {
  id: string;
  label: string;
  price: number;
  compareAtPrice: number | null;
  stock: number;
  active: boolean;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category: string;
  condition: Condition | null;
  status: 'active' | 'sold' | 'draft' | 'archived';
  description: string;
  specs: { label: string; value: string }[];
  tags: string[];
  featured: boolean;
  isNew: boolean;
  warranty: string | null;
  year: number | null;
  listedAt: string;
  variants: Variant[];
  images: string[];
}

export interface Category {
  slug: string;
  name: string;
}

export const conditionLabel: Record<Condition, string> = {
  'brand-new': 'Brand New',
  'open-box': 'Open Box',
  'uk-used': 'UK Used',
  used: 'Used',
};

const PRODUCT_SELECT = `
  id, slug, name, brand, condition, status, description, specs, tags, featured, is_new, warranty, year, listed_at,
  category:categories!inner(slug),
  variants:product_variants(id, label, price, compare_at_price, stock, active, sort),
  images:product_images(url, sort)
`;

type Row = {
  id: string; slug: string; name: string; brand: string; condition: Condition | null; status: Product['status'];
  description: string; specs: Product['specs'] | null; tags: string[] | null; featured: boolean; is_new: boolean;
  warranty: string | null; year: number | null; listed_at: string; category: { slug: string };
  variants: { id: string; label: string; price: number; compare_at_price: number | null; stock: number; active: boolean; sort: number }[];
  images: { url: string; sort: number }[];
};

const mapProduct = (r: Row): Product => ({
  id: r.id,
  slug: r.slug,
  name: r.name,
  brand: r.brand,
  category: r.category.slug,
  condition: r.condition,
  status: r.status,
  description: r.description,
  specs: r.specs ?? [],
  tags: r.tags ?? [],
  featured: r.featured,
  isNew: r.is_new,
  warranty: r.warranty,
  year: r.year,
  listedAt: r.listed_at,
  variants: [...r.variants]
    .sort((a, b) => a.sort - b.sort)
    .map((v) => ({ id: v.id, label: v.label, price: v.price, compareAtPrice: v.compare_at_price, stock: v.stock, active: v.active })),
  images: [...r.images].sort((a, b) => a.sort - b.sort).map((i) => i.url),
});

export const liveVariants = (p: Product) => p.variants.filter((v) => v.active);
export const inStock = (p: Product) => p.status === 'active' && p.variants.some((v) => v.active && v.stock > 0);
export const priceOf = (p: Product) => {
  const live = liveVariants(p);
  return live.length ? Math.min(...live.map((v) => v.price)) : 0;
};

export function matches(p: Product, q: string) {
  const hay = [p.name, p.brand, p.category, ...p.tags, ...p.specs.map((s) => s.value)].join(' ').toLowerCase();
  return q.toLowerCase().split(/\s+/).filter(Boolean).every((t) => hay.includes(t));
}

export async function fetchCatalog(): Promise<{ products: Product[]; categories: Category[] }> {
  const [p, c] = await withRetry(async () => {
    const res = await Promise.all([
      supabase.from('products').select(PRODUCT_SELECT).in('status', ['active', 'sold']),
      supabase.from('categories').select('slug, name').order('sort'),
    ]);
    if (res[0].error) throw new Error(res[0].error.message);
    if (res[1].error) throw new Error(res[1].error.message);
    return res;
  });
  const products = (p.data as unknown as Row[]).map(mapProduct);
  // Same ordering as the website: in stock first, then featured, then newest.
  products.sort(
    (a, b) =>
      Number(!inStock(a)) - Number(!inStock(b)) || Number(b.featured) - Number(a.featured) || b.listedAt.localeCompare(a.listedAt),
  );
  return { products, categories: c.data as Category[] };
}
