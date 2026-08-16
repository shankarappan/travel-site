'use client';

import { Button, ErrorState } from '@travel/ui';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';

export function CheckoutClient() {
  const params = useSearchParams();
  const offerId = params.get('offerId') ?? '';
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [paymentRef, setPaymentRef] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function startCheckout() {
    setPending(true);
    setError(null);
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          offerId,
          idempotencyKey: `checkout_${offerId}_${Date.now()}`,
        }),
      });
      const data = (await response.json()) as {
        order?: {
          id: string;
          lines: Array<{
            totalMinor: number;
            currency: string;
            cancellationTerms: string;
            propertyName: string;
          }>;
        };
        payment?: { providerRef: string; amountMinor: number; currency: string };
        error?: string;
      };
      if (!response.ok || !data.order || !data.payment) {
        setError(data.error ?? 'Checkout failed — sign in required');
        return;
      }
      setOrderId(data.order.id);
      setPaymentRef(data.payment.providerRef);
      setStatus(
        `Quote ready for ${data.order.lines[0]?.propertyName}. Total ${(data.payment.amountMinor / 100).toFixed(2)} ${data.payment.currency}. Cancellation: ${data.order.lines[0]?.cancellationTerms}`,
      );
    } catch {
      setError('Network error');
    } finally {
      setPending(false);
    }
  }

  async function simulatePaymentSuccess() {
    if (!paymentRef || !orderId) return;
    setPending(true);
    setError(null);
    try {
      const webhook = await fetch('/api/webhooks/payments', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-travel-webhook-signature': 'sandbox_secret',
        },
        body: JSON.stringify({
          eventId: `evt_${paymentRef}`,
          providerRef: paymentRef,
          status: 'succeeded',
        }),
      });
      if (!webhook.ok) {
        const data = (await webhook.json()) as { error?: string };
        setError(data.error ?? 'Payment webhook failed');
        return;
      }
      const booking = await fetch('/api/bookings/confirm', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ orderId }),
      });
      const bookingData = (await booking.json()) as {
        order?: { status: string; providerBookingId?: string | null };
        error?: string;
      };
      if (!booking.ok) {
        setError(bookingData.error ?? 'Supplier booking failed');
        return;
      }
      setStatus(
        `Payment succeeded. Booking ${bookingData.order?.status} (${bookingData.order?.providerBookingId ?? 'n/a'}). Confirmation email queued.`,
      );
    } catch {
      setError('Network error during payment/booking');
    } finally {
      setPending(false);
    }
  }

  if (!offerId) {
    return <ErrorState message="Missing offerId. Start from stay search." />;
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-[var(--travel-color-ink-soft)]">
        Checkout reprices before commitment. Card data never touches our servers (hosted/tokenized
        sandbox).
      </p>
      <Button disabled={pending} onClick={startCheckout}>
        Reprice and create payment session
      </Button>
      {paymentRef ? (
        <Button disabled={pending} variant="secondary" onClick={simulatePaymentSuccess}>
          Simulate sandbox payment success + book
        </Button>
      ) : null}
      {status ? <p className="text-sm text-[var(--travel-color-ink)]">{status}</p> : null}
      {error ? <ErrorState message={error} /> : null}
    </div>
  );
}
