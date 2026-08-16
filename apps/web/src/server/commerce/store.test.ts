import { beforeEach, describe, expect, it } from 'vitest';
import {
  confirmProviderBooking,
  createPaymentSession,
  createQuotedOrder,
  handlePaymentWebhook,
  listEmailIntents,
  reconcilePaidUnconfirmed,
  resetCommerceStore,
} from './store';

describe('commerce store', () => {
  beforeEach(() => {
    resetCommerceStore();
  });

  it('reprices, pays via webhook, books idempotently, and queues email', async () => {
    const { order } = await createQuotedOrder({
      userId: 'user_1',
      offerId: 'lakeview-lodge:2026-12-01:2026-12-03:2:0',
      idempotencyKey: 'idem-checkout-1',
    });
    expect(order.status).toBe('QUOTED');

    const payment = createPaymentSession(order);
    expect(payment.status).toBe('requires_payment');

    const paid = handlePaymentWebhook({
      eventId: 'evt_1',
      signature: 'sandbox_secret',
      providerRef: payment.providerRef,
      status: 'succeeded',
    });
    expect(paid.order?.status).toBe('PAID');

    const duplicate = handlePaymentWebhook({
      eventId: 'evt_1',
      signature: 'sandbox_secret',
      providerRef: payment.providerRef,
      status: 'succeeded',
    });
    expect(duplicate.duplicate).toBe(true);

    const confirmed = await confirmProviderBooking(order.id, 'user_1');
    expect(confirmed.status).toBe('CONFIRMED');
    expect(confirmed.providerBookingId).toBeTruthy();
    expect(listEmailIntents().some((email) => email.template === 'booking.confirmed')).toBe(true);
    expect(reconcilePaidUnconfirmed()).toEqual([]);
  });

  it('rejects invalid payment signatures', async () => {
    const { order } = await createQuotedOrder({
      userId: 'user_1',
      offerId: 'fern-retreat:2026-11-10:2026-11-12:2:0',
      idempotencyKey: 'idem-checkout-2',
    });
    const payment = createPaymentSession(order);
    expect(() =>
      handlePaymentWebhook({
        eventId: 'evt_bad',
        signature: 'wrong',
        providerRef: payment.providerRef,
        status: 'succeeded',
      }),
    ).toThrow(/signature/i);
  });
});
