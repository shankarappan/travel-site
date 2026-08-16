export type OrderStatus =
  | 'DRAFT'
  | 'QUOTED'
  | 'PAYMENT_PENDING'
  | 'PAID'
  | 'SUPPLIER_PENDING'
  | 'CONFIRMED'
  | 'PARTIALLY_CANCELLED'
  | 'CANCELLED'
  | 'REFUND_PENDING'
  | 'REFUNDED'
  | 'FAILED';

export interface Money {
  readonly amountMinor: number;
  readonly currency: string;
}

export function assertPositiveMoney(money: Money): void {
  if (!Number.isInteger(money.amountMinor) || money.amountMinor < 0) {
    throw new Error('Money amountMinor must be a non-negative integer');
  }
  if (!/^[A-Z]{3}$/.test(money.currency)) {
    throw new Error('Money currency must be a 3-letter ISO code');
  }
}

const ORDER_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  DRAFT: ['QUOTED', 'CANCELLED', 'FAILED'],
  QUOTED: ['PAYMENT_PENDING', 'CANCELLED', 'FAILED'],
  PAYMENT_PENDING: ['PAID', 'CANCELLED', 'FAILED'],
  PAID: ['SUPPLIER_PENDING', 'CONFIRMED', 'REFUND_PENDING', 'FAILED'],
  SUPPLIER_PENDING: ['CONFIRMED', 'REFUND_PENDING', 'FAILED'],
  CONFIRMED: ['PARTIALLY_CANCELLED', 'CANCELLED', 'REFUND_PENDING'],
  PARTIALLY_CANCELLED: ['CANCELLED', 'REFUND_PENDING', 'REFUNDED'],
  CANCELLED: ['REFUND_PENDING', 'REFUNDED'],
  REFUND_PENDING: ['REFUNDED', 'FAILED'],
  REFUNDED: [],
  FAILED: [],
};

export function canTransitionOrder(from: OrderStatus, to: OrderStatus): boolean {
  return ORDER_TRANSITIONS[from].includes(to);
}

export function transitionOrder(from: OrderStatus, to: OrderStatus): OrderStatus {
  if (!canTransitionOrder(from, to)) {
    throw new Error(`Illegal order transition ${from} -> ${to}`);
  }
  return to;
}
