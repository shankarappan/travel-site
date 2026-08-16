'use client';

import { Button, EmptyState, ErrorState, Field, Input, Skeleton } from '@travel/ui';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';

type Offer = {
  offerId: string;
  propertyName: string;
  roomName: string;
  total: { amountMinor: number; currency: string };
  taxesAndFees: { amountMinor: number; currency: string };
  cancellationSummary: string;
  expiresAt: string;
  checkIn: string;
  checkOut: string;
  nights: number;
};

function money(amountMinor: number, currency: string): string {
  return new Intl.NumberFormat('en-NZ', { style: 'currency', currency }).format(amountMinor / 100);
}

export function StaySearchPanel() {
  const router = useRouter();
  const params = useSearchParams();
  const [destination, setDestination] = useState(params.get('destination') ?? 'Queenstown');
  const [checkIn, setCheckIn] = useState(params.get('checkIn') ?? '2026-12-01');
  const [checkOut, setCheckOut] = useState(params.get('checkOut') ?? '2026-12-03');
  const [adults, setAdults] = useState(params.get('adults') ?? '2');
  const [sort, setSort] = useState<'price' | 'name'>('price');
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runSearch(next = { destination, checkIn, checkOut, adults }) {
    setLoading(true);
    setError(null);
    const query = new URLSearchParams({
      destination: next.destination,
      checkIn: next.checkIn,
      checkOut: next.checkOut,
      adults: next.adults,
      children: '0',
      currency: 'NZD',
    });
    router.replace(`/search?${query.toString()}`);
    try {
      const response = await fetch(`/api/stays/search?${query.toString()}`);
      const data = (await response.json()) as {
        offers?: Offer[];
        partialError?: string | null;
        error?: string;
      };
      if (!response.ok && !data.offers) {
        setError(data.error ?? data.partialError ?? 'Search failed');
        setOffers([]);
        return;
      }
      setOffers(data.offers ?? []);
      if (data.partialError) setError(data.partialError);
    } catch {
      setError('Network error talking to stay search');
      setOffers([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void runSearch({
      destination: params.get('destination') ?? 'Queenstown',
      checkIn: params.get('checkIn') ?? '2026-12-01',
      checkOut: params.get('checkOut') ?? '2026-12-03',
      adults: params.get('adults') ?? '2',
    });
    // Run once on mount from URL/default search params.
  }, []);

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    void runSearch();
  }

  const sorted = [...offers].sort((a, b) =>
    sort === 'price'
      ? a.total.amountMinor - b.total.amountMinor
      : a.propertyName.localeCompare(b.propertyName),
  );

  return (
    <div className="space-y-6">
      <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Field id="destination" label="Destination">
          <Input
            id="destination"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
          />
        </Field>
        <Field id="checkIn" label="Check-in">
          <Input
            id="checkIn"
            type="date"
            value={checkIn}
            onChange={(e) => setCheckIn(e.target.value)}
          />
        </Field>
        <Field id="checkOut" label="Check-out">
          <Input
            id="checkOut"
            type="date"
            value={checkOut}
            onChange={(e) => setCheckOut(e.target.value)}
          />
        </Field>
        <Field id="adults" label="Adults">
          <Input
            id="adults"
            type="number"
            min={1}
            max={16}
            value={adults}
            onChange={(e) => setAdults(e.target.value)}
          />
        </Field>
        <div className="flex items-end">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Searching…' : 'Search stays'}
          </Button>
        </div>
      </form>

      <div className="flex flex-wrap items-center gap-3">
        <label className="text-sm text-[var(--travel-color-ink-soft)]">
          Sort{' '}
          <select
            className="ml-2 rounded-[var(--travel-radius-md)] border border-[var(--travel-color-border)] bg-white px-2 py-1"
            value={sort}
            onChange={(event) => setSort(event.target.value as 'price' | 'name')}
          >
            <option value="price">Price</option>
            <option value="name">Name</option>
          </select>
        </label>
        <span className="text-sm text-[var(--travel-color-ink-soft)]">
          List view · map toggle coming later
        </span>
      </div>

      {loading ? (
        <div className="grid gap-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : null}

      {error ? <ErrorState message={error} onRetry={() => void runSearch()} /> : null}

      {!loading && !error && sorted.length === 0 ? (
        <EmptyState title="No stays found" description="Try another destination or date range." />
      ) : null}

      <ul className="space-y-3">
        {sorted.map((offer) => {
          const expired = Date.parse(offer.expiresAt) < Date.now();
          return (
            <li
              key={offer.offerId}
              className="border border-[var(--travel-color-border)] bg-[var(--travel-color-surface-elevated)] p-4"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-[var(--travel-color-ink)]">
                    {offer.propertyName}
                  </h2>
                  <p className="text-sm text-[var(--travel-color-ink-soft)]">
                    {offer.roomName} · {offer.nights} nights · {offer.checkIn} → {offer.checkOut}
                  </p>
                  <p className="mt-2 text-sm text-[var(--travel-color-ink-soft)]">
                    {offer.cancellationSummary}
                  </p>
                  <p className="mt-1 text-xs text-[var(--travel-color-ink-soft)]">
                    Offer{' '}
                    {expired
                      ? 'expired'
                      : `expires ${new Date(offer.expiresAt).toLocaleString('en-NZ')}`}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-semibold">
                    {money(offer.total.amountMinor, offer.total.currency)}
                  </p>
                  <p className="text-xs text-[var(--travel-color-ink-soft)]">
                    incl. taxes/fees{' '}
                    {money(offer.taxesAndFees.amountMinor, offer.taxesAndFees.currency)}
                  </p>
                  <Button
                    className="mt-3"
                    disabled={expired}
                    onClick={() => {
                      router.push(`/checkout?offerId=${encodeURIComponent(offer.offerId)}`);
                    }}
                  >
                    Review quote
                  </Button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
