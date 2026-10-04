import { supabase } from './supabase';

// Orders are read straight from the database; RLS only returns the signed-in customer's own orders.

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
export type PaymentStatus = 'unpaid' | 'pending' | 'paid' | 'failed' | 'refunded';

export const orderStatusLabel: Record<OrderStatus, string> = {
  pending: 'Pending',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
};

// Same wording as the website (applemike-store/src/lib/orders/types.ts).
export const paymentStatusLabel: Record<PaymentStatus, string> = {
  unpaid: 'Pay on delivery',
  pending: 'Payment pending',
  paid: 'Paid',
  failed: 'Payment failed',
  refunded: 'Refunded',
};

export interface OrderSummary {
  id: string;
  orderNumber: string;
  total: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  createdAt: string;
  itemCount: number;
}

export interface OrderDetail extends OrderSummary {
  fulfilment: 'pickup' | 'delivery';
  fullName: string;
  phone: string;
  deliveryAddress: string | null;
  deliveryCity: string | null;
  deliveryState: string | null;
  deliveryNotes: string | null;
  subtotal: number;
  deliveryFee: number | null;
  items: { name: string; label: string; slug: string | null; unitPrice: number; quantity: number; lineTotal: number }[];
}

export async function fetchOrders(): Promise<OrderSummary[]> {
  const { data, error } = await supabase
    .from('orders')
    .select('id, order_number, total, status, payment_status, created_at, order_items(count)')
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) throw new Error(error.message);
  return (data ?? []).map((o) => ({
    id: o.id,
    orderNumber: o.order_number,
    total: o.total,
    status: o.status,
    paymentStatus: o.payment_status,
    createdAt: o.created_at,
    itemCount: (o.order_items as unknown as { count: number }[])[0]?.count ?? 0,
  }));
}

export async function fetchOrder(id: string): Promise<OrderDetail | null> {
  const { data, error } = await supabase
    .from('orders')
    .select(
      'id, order_number, total, subtotal, delivery_fee, status, payment_status, created_at, fulfilment, full_name, phone, delivery_address, delivery_city, delivery_state, delivery_notes, items:order_items(product_name, variant_label, product_slug, unit_price, quantity, line_total)',
    )
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  return {
    id: data.id,
    orderNumber: data.order_number,
    total: data.total,
    subtotal: data.subtotal,
    deliveryFee: data.delivery_fee,
    status: data.status,
    paymentStatus: data.payment_status,
    createdAt: data.created_at,
    fulfilment: data.fulfilment,
    fullName: data.full_name,
    phone: data.phone,
    deliveryAddress: data.delivery_address,
    deliveryCity: data.delivery_city,
    deliveryState: data.delivery_state,
    deliveryNotes: data.delivery_notes,
    itemCount: data.items.length,
    items: data.items.map((i: Record<string, unknown>) => ({
      name: i.product_name as string,
      label: i.variant_label as string,
      slug: (i.product_slug as string) ?? null,
      unitPrice: i.unit_price as number,
      quantity: i.quantity as number,
      lineTotal: i.line_total as number,
    })),
  };
}
