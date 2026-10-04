import { orderStatusLabel, paymentStatusLabel, type OrderStatus, type PaymentStatus } from '@/lib/orders';
import { Pill } from './ui';

/** Same colour logic as the website's StatusPill. */
export function StatusPill({ kind, value }: { kind: 'order' | 'payment'; value: string }) {
  const label = kind === 'order' ? orderStatusLabel[value as OrderStatus] : paymentStatusLabel[value as PaymentStatus];
  const tone =
    value === 'paid' || value === 'delivered' ? 'ok' : value === 'failed' || value === 'cancelled' ? 'brand' : value === 'pending' || value === 'unpaid' ? 'amber' : 'neutral';
  return <Pill tone={tone}>{label ?? value}</Pill>;
}
