import {
  advanceOrder,
  createOrder,
  type Order,
  type PaymentRecord,
  type PaymentStatus,
} from '@travel/domain';
import { getDefaultAccommodationProvider } from '@travel/providers';
import { createLogger } from '@travel/observability';

const logger = createLogger({ service: 'commerce' });
const provider = getDefaultAccommodationProvider();

const orders = new Map<string, Order>();
const payments = new Map<string, PaymentRecord>();
const webhookEvents = new Set<string>();
const emailIntents: Array<{
  id: string;
  template: string;
  version: string;
  to: string;
  status: 'queued' | 'sent' | 'failed';
  providerMessageId: string | null;
}> = [];

export function resetCommerceStore(): void {
  orders.clear();
  payments.clear();
  webhookEvents.clear();
  emailIntents.length = 0;
}

export async function createQuotedOrder(input: {
  userId: string;
  offerId: string;
  idempotencyKey: string;
}): Promise<{ order: Order; quoteId: string }> {
  const existing = [...orders.values()].find(
    (order) => order.userId.value === input.userId && order.idempotencyKey === input.idempotencyKey,
  );
  if (existing) {
    return { order: existing, quoteId: existing.quoteId ?? '' };
  }

  const quote = await provider.reprice(input.offerId);
  const order = createOrder({
    userId: input.userId,
    quoteId: quote.quoteId,
    idempotencyKey: input.idempotencyKey,
    lines: [
      {
        offerId: input.offerId,
        propertyName: input.offerId.split(':')[0] ?? 'Stay',
        checkIn: input.offerId.split(':')[1] ?? '',
        checkOut: input.offerId.split(':')[2] ?? '',
        totalMinor: quote.total.amountMinor,
        currency: quote.total.currency,
        cancellationTerms: quote.cancellationTerms,
      },
    ],
  });
  orders.set(order.id, order);
  return { order, quoteId: quote.quoteId };
}

export function getOrderForUser(orderId: string, userId: string): Order {
  const order = orders.get(orderId);
  if (!order || order.userId.value !== userId) {
    throw new Error('Order not found');
  }
  return order;
}

export function createPaymentSession(order: Order): PaymentRecord {
  const line = order.lines[0];
  if (!line) throw new Error('Order has no lines');
  const payment: PaymentRecord = {
    id: `pay_${crypto.randomUUID()}`,
    orderId: order.id,
    amountMinor: line.totalMinor,
    currency: line.currency,
    status: 'requires_payment',
    providerRef: `sandbox_pi_${crypto.randomUUID()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  payments.set(payment.id, payment);
  const pending = advanceOrder(order, 'PAYMENT_PENDING', { paymentId: payment.id });
  orders.set(order.id, pending);
  return payment;
}

export function handlePaymentWebhook(input: {
  eventId: string;
  signature: string;
  providerRef: string;
  status: PaymentStatus;
}): { duplicate: boolean; order?: Order } {
  if (input.signature !== 'sandbox_secret') {
    throw new Error('Invalid webhook signature');
  }
  if (webhookEvents.has(input.eventId)) {
    return { duplicate: true };
  }
  webhookEvents.add(input.eventId);

  const payment = [...payments.values()].find((item) => item.providerRef === input.providerRef);
  if (!payment) {
    throw new Error('Payment not found');
  }
  const updatedPayment = {
    ...payment,
    status: input.status,
    updatedAt: new Date().toISOString(),
  };
  payments.set(payment.id, updatedPayment);

  const order = orders.get(payment.orderId);
  if (!order) throw new Error('Order missing for payment');

  if (input.status === 'succeeded') {
    const paid = advanceOrder(order, 'PAID');
    orders.set(order.id, paid);
    queueEmail({
      template: 'booking.payment_received',
      version: '1.0.0',
      to: 'guest@example.com',
    });
    return { duplicate: false, order: paid };
  }
  if (input.status === 'failed') {
    const failed = advanceOrder(order, 'FAILED');
    orders.set(order.id, failed);
    return { duplicate: false, order: failed };
  }
  return { duplicate: false, order };
}

export async function confirmProviderBooking(orderId: string, userId: string): Promise<Order> {
  const order = getOrderForUser(orderId, userId);
  if (order.status !== 'PAID' && order.status !== 'SUPPLIER_PENDING') {
    throw new Error('Order must be paid before supplier booking');
  }
  if (!order.quoteId) throw new Error('Missing quote');

  const pending = advanceOrder(order, 'SUPPLIER_PENDING');
  orders.set(order.id, pending);

  const result = await provider.book(
    {
      quoteId: order.quoteId,
      guestName: 'Guest Traveller',
      guestEmail: 'guest@example.com',
    },
    `book_${order.idempotencyKey}`,
  );

  const confirmed = advanceOrder(pending, result.status === 'confirmed' ? 'CONFIRMED' : 'FAILED', {
    providerBookingId: result.providerBookingId,
  });
  orders.set(order.id, confirmed);
  queueEmail({
    template: result.status === 'confirmed' ? 'booking.confirmed' : 'booking.failed',
    version: '1.0.0',
    to: 'guest@example.com',
  });
  return confirmed;
}

export function reconcilePaidUnconfirmed(): Order[] {
  const exceptions = [...orders.values()].filter(
    (order) => order.status === 'PAID' || order.status === 'SUPPLIER_PENDING',
  );
  for (const order of exceptions) {
    logger.warn('commerce.paid_but_unconfirmed', { orderId: order.id, status: order.status });
  }
  return exceptions;
}

export function queueEmail(input: { template: string; version: string; to: string }) {
  emailIntents.push({
    id: `email_${crypto.randomUUID()}`,
    template: input.template,
    version: input.version,
    to: input.to,
    status: 'sent',
    providerMessageId: `msg_${crypto.randomUUID()}`,
  });
}

export function listEmailIntents() {
  return [...emailIntents];
}

export function listOrders() {
  return [...orders.values()];
}

export function getPayment(paymentId: string) {
  return payments.get(paymentId);
}
