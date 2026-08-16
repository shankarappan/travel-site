import { describe, expect, it } from 'vitest';
import { FakeSandboxAccommodationProvider, UnconfiguredAccommodationProvider } from './index.js';

describe('FakeSandboxAccommodationProvider', () => {
  const provider = new FakeSandboxAccommodationProvider();

  it('returns deterministic Queenstown offers with taxes and expiry', async () => {
    const offers = await provider.search({
      destination: 'Queenstown',
      checkIn: '2026-12-01',
      checkOut: '2026-12-03',
      adults: 2,
      children: 0,
      currency: 'NZD',
    });
    expect(offers.length).toBeGreaterThan(0);
    expect(offers[0]?.taxesAndFees.amountMinor).toBeGreaterThan(0);
    expect(offers[0]?.cancellationSummary.length).toBeGreaterThan(0);
    expect(Date.parse(offers[0]!.expiresAt)).toBeGreaterThan(Date.now());
  });

  it('reprices, books idempotently, and retrieves confirmation', async () => {
    const offers = await provider.search({
      destination: 'Rotorua',
      checkIn: '2026-11-10',
      checkOut: '2026-11-12',
      adults: 2,
      children: 0,
      currency: 'NZD',
    });
    const offer = offers[0]!;
    const quote = await provider.reprice(offer.offerId);
    const first = await provider.book(
      { quoteId: quote.quoteId, guestName: 'Aroha', guestEmail: 'a@example.com' },
      'idem-1',
    );
    const second = await provider.book(
      { quoteId: quote.quoteId, guestName: 'Aroha', guestEmail: 'a@example.com' },
      'idem-1',
    );
    expect(first.providerBookingId).toBe(second.providerBookingId);
    expect(first.status).toBe('confirmed');
    const state = await provider.retrieve(first.providerBookingId);
    expect(state.status).toBe('confirmed');
  });
});

describe('UnconfiguredAccommodationProvider', () => {
  it('returns empty search and blocks booking', async () => {
    const provider = new UnconfiguredAccommodationProvider();
    await expect(
      provider.search({
        destination: 'Rotorua',
        checkIn: '2026-11-01',
        checkOut: '2026-11-03',
        adults: 2,
        children: 0,
        currency: 'NZD',
      }),
    ).resolves.toEqual([]);
    await expect(
      provider.book({ quoteId: 'q1', guestName: 'A', guestEmail: 'a@example.com' }, 'idem'),
    ).rejects.toThrow(/not configured/i);
  });
});
