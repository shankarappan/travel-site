import type { Metadata } from 'next';
import { Suspense } from 'react';
import { CheckoutClient } from '../../components/checkout/checkout-client';

export const metadata: Metadata = {
  title: 'Review stay',
};

export default function CheckoutPage() {
  return (
    <div className="mx-auto max-w-[var(--travel-shell-max)] px-4 py-10 sm:px-6 sm:py-14">
      <p className="travel-caption">Booking</p>
      <h1 className="travel-h1 mt-2 text-[var(--travel-color-ink)]">Review your stay</h1>
      <p className="mt-3 max-w-xl text-[var(--travel-color-ink-soft)]">
        Confirm the details before payment. Card information is handled securely and never stored
        with us.
      </p>
      <div className="mt-8 max-w-xl rounded-[var(--travel-radius-xl)] bg-[var(--travel-color-surface-elevated)] p-6 shadow-[var(--travel-elevation-1)]">
        <Suspense fallback={<p>Loading checkout…</p>}>
          <CheckoutClient />
        </Suspense>
      </div>
    </div>
  );
}
