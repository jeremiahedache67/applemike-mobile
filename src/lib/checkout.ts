import { config } from './config';
import { supabase } from './supabase';

// Orders go through the website's own checkout endpoint (POST /api/checkout → createOrder()),
// so validation, server-side pricing, order records and confirmation emails match the website exactly.

export interface CheckoutInput {
  fullName: string;
  email: string;
  phone: string;
  fulfilment: 'pickup' | 'delivery';
  state?: string;
  city?: string;
  address?: string;
  notes?: string;
  saveAddress?: boolean;
  lines: { variantId: string; quantity: number }[];
}

export type CheckoutResult =
  | { ok: true; orderNumber?: string; redirectUrl: string }
  | { ok: false; kind: 'invalid'; fieldErrors: Record<string, string> }
  | { ok: false; kind: 'cart-changed' }
  | { ok: false; kind: 'unauthorized' | 'not-configured' | 'payment-init' | 'server' | 'network'; message: string };

export async function placeOrder(input: CheckoutInput): Promise<CheckoutResult> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  // Not retried automatically: a retry after a dropped response could create a duplicate order.
  try {
    const res = await fetch(`${config.siteUrl}/api/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(input),
    });
    const body = (await res.json().catch(() => null)) as CheckoutResult | null;
    return body ?? { ok: false, kind: 'server', message: 'Our server had a problem. Please try again in a moment.' };
  } catch {
    return { ok: false, kind: 'network', message: "You're offline or the connection dropped. Check your internet and try again." };
  }
}

export const NIGERIAN_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno', 'Cross River', 'Delta',
  'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT (Abuja)', 'Gombe', 'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina',
  'Kebbi', 'Kogi', 'Kwara', 'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers',
  'Sokoto', 'Taraba', 'Yobe', 'Zamfara',
] as const;

export const PHONE_RE = /^(\+?234|0)[789][01]\d{8}$/;
