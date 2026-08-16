import type { Metadata } from 'next';
import { Suspense } from 'react';
import { CheckoutClient } from '../../components/checkout/checkout-client';

export const metadata: Metadata = {
  title: 'Checkout',
};

export default function CheckoutPage() {
  return (
    <div className="mx-auto max-w-[var(--travel-shell-max)] px-4 py-8 sm:px-6 sm:py-12">
      <h1 className="font-[family-name:var(--travel-font-display)] text-3xl font-semibold">
        Checkout
      </h1>
      <div className="mt-6">
        <Suspense fallback={<p>Loading checkout…</p>}>
          <CheckoutClient />
        </Suspense>
      </div>
    </div>
  );
}
