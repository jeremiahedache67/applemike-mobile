const required = (name: string, value: string | undefined) => {
  if (!value) throw new Error(`Missing ${name} — add it to .env.local (see README).`);
  return value;
};

export const config = {
  supabaseUrl: required('EXPO_PUBLIC_SUPABASE_URL', process.env.EXPO_PUBLIC_SUPABASE_URL),
  // Publishable (anon) key — safe to ship in an app; database access is enforced by RLS.
  supabaseKey: required('EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY', process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY),
  // The website: product photos and the shared checkout endpoint live here.
  siteUrl: (process.env.EXPO_PUBLIC_SITE_URL ?? 'https://applemike-store.vercel.app').replace(/\/$/, ''),
};

export const store = {
  phoneDisplay: '0703 071 8600',
  phoneE164: '+2347030718600',
  whatsapp: '2347030718600',
  address: 'New Banex Plaza, Wuse 2, Abuja',
};

/** Product photos are stored as site paths ("/products/…") or absolute URLs (admin uploads). */
export function imageUrl(src: string | undefined | null) {
  if (!src) return null;
  return src.startsWith('http') ? src : `${config.siteUrl}${src}`;
}

export const whatsappLink = (message: string) => `https://wa.me/${store.whatsapp}?text=${encodeURIComponent(message)}`;
