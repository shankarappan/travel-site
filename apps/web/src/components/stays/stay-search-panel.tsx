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

const PROPERTY_IMAGES: Record<string, string> = {
  'lakeview-lodge':
    'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
  'fern-retreat':
    'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80',
  'harbour-house':
    'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80',
  'fiord-cabin':
    'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&w=1200&q=80',
};

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
    <div className="space-y-8">
      <form
        onSubmit={onSubmit}
        className="grid gap-3 rounded-[var(--travel-radius-xl)] bg-[var(--travel-color-surface-elevated)] p-4 shadow-[var(--travel-elevation-1)] sm:grid-cols-2 lg:grid-cols-5"
      >
        <Field id="destination" label="Where to">
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
        <Field id="adults" label="Travellers">
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
          <Button type="submit" className="min-h-11 w-full" disabled={loading}>
            {loading ? 'Searching…' : 'Search stays'}
          </Button>
        </div>
      </form>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="text-sm text-[var(--travel-color-ink-soft)]">
          Sort{' '}
          <select
            className="ml-2 rounded-[var(--travel-radius-md)] border border-[var(--travel-color-border)] bg-white px-2 py-2"
            value={sort}
            onChange={(event) => setSort(event.target.value as 'price' | 'name')}
          >
            <option value="price">Price</option>
            <option value="name">Name</option>
          </select>
        </label>
        <p className="text-sm text-[var(--travel-color-ink-muted)]">
          Sample stays for exploring the experience
        </p>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-64 w-full rounded-[var(--travel-radius-lg)]" />
          <Skeleton className="h-64 w-full rounded-[var(--travel-radius-lg)]" />
        </div>
      ) : null}

      {error ? <ErrorState message={error} onRetry={() => void runSearch()} /> : null}

      {!loading && !error && sorted.length === 0 ? (
        <EmptyState
          title="No stays found"
          description="Try another destination or date range — or ask the concierge for ideas."
        />
      ) : null}

      <ul className="grid gap-5 lg:grid-cols-2">
        {sorted.map((offer) => {
          const expired = Date.parse(offer.expiresAt) < Date.now();
          const propertyKey = offer.offerId.split(':')[0] ?? '';
          const image =
            PROPERTY_IMAGES[propertyKey] ??
            'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80';
          return (
            <li key={offer.offerId}>
              <article className="overflow-hidden rounded-[var(--travel-radius-lg)] bg-[var(--travel-color-surface-elevated)] shadow-[var(--travel-elevation-1)]">
                <div
                  className="aspect-[16/10] bg-cover bg-center"
                  style={{ backgroundImage: `url(${image})` }}
                  role="img"
                  aria-label={`${offer.propertyName} exterior`}
                />
                <div className="space-y-3 p-5">
                  <div>
                    <h2 className="travel-h3 text-[var(--travel-color-ink)]">
                      {offer.propertyName}
                    </h2>
                    <p className="mt-1 text-sm text-[var(--travel-color-ink-soft)]">
                      {offer.roomName} · {offer.nights} nights · {offer.checkIn} → {offer.checkOut}
                    </p>
                  </div>
                  <p className="text-sm text-[var(--travel-color-ink-soft)]">
                    {offer.cancellationSummary}
                  </p>
                  <div className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                      <p className="travel-price">
                        {money(offer.total.amountMinor, offer.total.currency)}
                      </p>
                      <p className="text-xs text-[var(--travel-color-ink-muted)]">
                        Includes taxes & fees ·{' '}
                        {expired
                          ? 'Offer expired'
                          : `Hold until ${new Date(offer.expiresAt).toLocaleString('en-NZ')}`}
                      </p>
                    </div>
                    <Button
                      disabled={expired}
                      onClick={() => {
                        router.push(`/checkout?offerId=${encodeURIComponent(offer.offerId)}`);
                      }}
                    >
                      Review stay
                    </Button>
                  </div>
                </div>
              </article>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
