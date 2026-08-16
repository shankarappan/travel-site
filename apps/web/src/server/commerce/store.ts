import { advanceOrder, createOrder, type Order, type PaymentRecord, type PaymentStatus } from '@travel/domain';
import { createLogger } from '@travel/observability';
import { getDefaultAccommodationProvider } from '@travel/providers';
import { commerceRepository } from '../persistence/repos';

const logger = createLogger({ service: 'commerce' });
const provider = getDefaultAccommodationProvider();

export async function createQuotedOrder(input: {
  userId: string;
  offerId: string;
  idempotencyKey: string;
}): Promise<{ order: Order; quoteId: string }> {
  const repo = commerceRepository();
  const existing = await repo.findOrderByIdempotency(input.userId, input.idempotencyKey);
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
  const saved = await repo.saveOrder(order);
  await repo.recordStatusTransition({
    orderId: saved.id,
    fromStatus: null,
    toStatus: saved.status,
    reason: 'quote_created',
  });
  return { order: saved, quoteId: quote.quoteId };
}

export async function getOrderForUser(orderId: string, userId: string): Promise<Order> {
  return commerceRepository().getOrderForUser(orderId, userId);
}

export async function createPaymentSession(order: Order): Promise<PaymentRecord> {
  const repo = commerceRepository();
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
  await repo.savePayment(payment);
  const pending = advanceOrder(order, 'PAYMENT_PENDING', { paymentId: payment.id });
  await repo.saveOrder(pending);
  await repo.recordStatusTransition({
    orderId: order.id,
    fromStatus: order.status,
    toStatus: pending.status,
    reason: 'payment_session_created',
  });
  return payment;
}

export async function handlePaymentWebhook(input: {
  eventId: string;
  signature: string;
  providerRef: string;
  status: PaymentStatus;
}): Promise<{ duplicate: boolean; order?: Order }> {
  if (input.signature !== 'sandbox_secret') {
    throw new Error('Invalid webhook signature');
  }
  const repo = commerceRepository();
  const recorded = await repo.recordWebhookEvent({
    eventId: input.eventId,
    source: 'payments',
    providerRef: input.providerRef,
    status: input.status,
  });
  if (recorded.duplicate) {
    return { duplicate: true };
  }

  const payment = await repo.findPaymentByProviderRef(input.providerRef);
  if (!payment) {
    throw new Error('Payment not found');
  }
  await repo.savePayment({
    ...payment,
    status: input.status,
    updatedAt: new Date().toISOString(),
  });

  const order = await repo.getOrderById(payment.orderId);
  if (!order) throw new Error('Order missing for payment');

  if (input.status === 'succeeded') {
    if (order.status === 'PAID' || order.status === 'SUPPLIER_PENDING' || order.status === 'CONFIRMED') {
      return { duplicate: false, order };
    }
    const paid = advanceOrder(order, 'PAID');
    await repo.saveOrder(paid);
    await repo.recordStatusTransition({
      orderId: order.id,
      fromStatus: order.status,
      toStatus: paid.status,
      reason: 'payment_webhook_succeeded',
    });
    await repo.queueEmail({
      template: 'booking.payment_received',
      version: '1.0.0',
      to: 'guest@example.com',
      orderId: order.id,
    });
    return { duplicate: false, order: paid };
  }
  if (input.status === 'failed') {
    const failed = advanceOrder(order, 'FAILED');
    await repo.saveOrder(failed);
    await repo.recordStatusTransition({
      orderId: order.id,
      fromStatus: order.status,
      toStatus: failed.status,
      reason: 'payment_webhook_failed',
    });
    return { duplicate: false, order: failed };
  }
  return { duplicate: false, order };
}

export async function confirmProviderBooking(orderId: string, userId: string): Promise<Order> {
  const repo = commerceRepository();
  const order = await repo.getOrderForUser(orderId, userId);
  if (order.status === 'CONFIRMED' && order.providerBookingId) {
    return order;
  }
  if (order.status !== 'PAID' && order.status !== 'SUPPLIER_PENDING') {
    throw new Error('Order must be paid before supplier booking');
  }
  if (!order.quoteId) throw new Error('Missing quote');

  const bookingKey = `book_${order.idempotencyKey}`;
  const claim = await repo.saveBookingAttempt({
    id: crypto.randomUUID(),
    orderId: order.id,
    idempotencyKey: bookingKey,
    providerBookingId: order.providerBookingId,
    status: 'pending',
  });

  if (!claim.created && claim.status === 'confirmed' && claim.providerBookingId) {
    const pending =
      order.status === 'SUPPLIER_PENDING' ? order : advanceOrder(order, 'SUPPLIER_PENDING');
    const confirmed = advanceOrder(pending, 'CONFIRMED', {
      providerBookingId: claim.providerBookingId,
    });
    await repo.saveOrder(confirmed);
    return confirmed;
  }

  const pending =
    order.status === 'SUPPLIER_PENDING' ? order : advanceOrder(order, 'SUPPLIER_PENDING');
  if (order.status !== 'SUPPLIER_PENDING') {
    await repo.saveOrder(pending);
    await repo.recordStatusTransition({
      orderId: order.id,
      fromStatus: order.status,
      toStatus: pending.status,
      reason: 'supplier_booking_started',
    });
  }

  const result = await provider.book(
    {
      quoteId: order.quoteId,
      guestName: 'Guest Traveller',
      guestEmail: 'guest@example.com',
    },
    bookingKey,
  );

  await repo.saveBookingAttempt({
    id: crypto.randomUUID(),
    orderId: order.id,
    idempotencyKey: bookingKey,
    providerBookingId: result.providerBookingId,
    status: result.status,
  });

  const confirmed = advanceOrder(pending, result.status === 'confirmed' ? 'CONFIRMED' : 'FAILED', {
    providerBookingId: result.providerBookingId,
  });
  await repo.saveOrder(confirmed);
  await repo.recordStatusTransition({
    orderId: order.id,
    fromStatus: pending.status,
    toStatus: confirmed.status,
    reason: 'supplier_booking_finished',
  });
  await repo.queueEmail({
    template: result.status === 'confirmed' ? 'booking.confirmed' : 'booking.failed',
    version: '1.0.0',
    to: 'guest@example.com',
    orderId: order.id,
  });
  return confirmed;
}

export async function reconcilePaidUnconfirmed(): Promise<Order[]> {
  const exceptions = await commerceRepository().listPaidUnconfirmed();
  for (const order of exceptions) {
    logger.warn('commerce.paid_but_unconfirmed', {
      orderId: order.id,
      status: order.status,
      paymentId: order.paymentId,
    });
  }
  return exceptions;
}

export async function queueEmail(input: {
  template: string;
  version: string;
  to: string;
  orderId?: string | null;
}) {
  return commerceRepository().queueEmail(input);
}

export async function listEmailIntents() {
  return commerceRepository().listEmailIntents();
}

export async function listOrders() {
  return commerceRepository().listOrders();
}

export async function getPayment(paymentId: string) {
  return commerceRepository().getPayment(paymentId);
}
