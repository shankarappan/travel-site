import { describe, expect, it } from 'vitest';
import { advanceOrder, createOrder } from './commerce.js';

describe('commerce order helpers', () => {
  it('creates quoted orders and advances through payment', () => {
    const order = createOrder({
      userId: 'user_1',
      quoteId: 'quote_1',
      idempotencyKey: 'idem_1',
      lines: [
        {
          offerId: 'offer_1',
          propertyName: 'Lakeview Lodge',
          checkIn: '2026-12-01',
          checkOut: '2026-12-03',
          totalMinor: 10000,
          currency: 'NZD',
          cancellationTerms: 'Free cancellation',
        },
      ],
    });
    expect(order.status).toBe('QUOTED');
    const pending = advanceOrder(order, 'PAYMENT_PENDING', { paymentId: 'pay_1' });
    expect(pending.status).toBe('PAYMENT_PENDING');
    expect(pending.paymentId).toBe('pay_1');
  });
});
