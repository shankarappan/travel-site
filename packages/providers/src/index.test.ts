import { describe, expect, it } from 'vitest';
import { UnconfiguredAccommodationProvider } from './index.js';

describe('UnconfiguredAccommodationProvider', () => {
  const provider = new UnconfiguredAccommodationProvider();

  it('returns empty search results', async () => {
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
  });

  it('blocks booking until a real adapter is wired', async () => {
    await expect(
      provider.book({ quoteId: 'q1', guestName: 'Aroha', guestEmail: 'a@example.com' }, 'idem-1'),
    ).rejects.toThrow(/not configured/i);
  });
});
