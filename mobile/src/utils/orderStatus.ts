import type { OrderStatus } from '@/types/order';

const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING_PAYMENT: ['PAID', 'CANCELED'],
  PAID: ['SHIPPED', 'CANCELED'],
  SHIPPED: ['DELIVERED'],
  DELIVERED: [],
  CANCELED: [],
};

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return TRANSITIONS[from].includes(to);
}

export function nextStatuses(from: OrderStatus): OrderStatus[] {
  return TRANSITIONS[from];
}

export function isFinalStatus(status: OrderStatus): boolean {
  return TRANSITIONS[status].length === 0;
}
