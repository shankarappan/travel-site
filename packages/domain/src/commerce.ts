import { canTransitionOrder, transitionOrder, type OrderStatus } from './order.js';
import { createUserId, type UserId } from './user.js';

export interface OrderLine {
  readonly offerId: string;
  readonly propertyName: string;
  readonly checkIn: string;
  readonly checkOut: string;
  readonly totalMinor: number;
  readonly currency: string;
  readonly cancellationTerms: string;
}

export interface Order {
  readonly id: string;
  readonly userId: UserId;
  readonly status: OrderStatus;
  readonly quoteId: string | null;
  readonly lines: readonly OrderLine[];
  readonly paymentId: string | null;
  readonly providerBookingId: string | null;
  readonly idempotencyKey: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export function createOrder(input: {
  userId: string;
  lines: OrderLine[];
  quoteId: string;
  idempotencyKey: string;
  now?: Date;
}): Order {
  const now = (input.now ?? new Date()).toISOString();
  return {
    id: `order_${crypto.randomUUID()}`,
    userId: createUserId(input.userId),
    status: 'QUOTED',
    quoteId: input.quoteId,
    lines: input.lines,
    paymentId: null,
    providerBookingId: null,
    idempotencyKey: input.idempotencyKey,
    createdAt: now,
    updatedAt: now,
  };
}

export function advanceOrder(order: Order, to: OrderStatus, patch: Partial<Order> = {}): Order {
  if (!canTransitionOrder(order.status, to) && order.status !== to) {
    // allow same-status no-op for idempotent webhooks
    throw new Error(`Illegal order transition ${order.status} -> ${to}`);
  }
  const status = order.status === to ? order.status : transitionOrder(order.status, to);
  return {
    ...order,
    ...patch,
    status,
    updatedAt: new Date().toISOString(),
  };
}

export type PaymentStatus = 'requires_payment' | 'processing' | 'succeeded' | 'failed' | 'refunded';

export interface PaymentRecord {
  readonly id: string;
  readonly orderId: string;
  readonly amountMinor: number;
  readonly currency: string;
  readonly status: PaymentStatus;
  readonly providerRef: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}
