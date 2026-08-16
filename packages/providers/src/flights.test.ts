import { describe, expect, it } from 'vitest';
import { UnconfiguredFlightProvider } from './flights.js';

describe('flight provider stub', () => {
  it('returns empty search until commercial access is verified', async () => {
    const provider = new UnconfiguredFlightProvider();
    await expect(
      provider.search({
        origin: 'AKL',
        destination: 'ZQN',
        departDate: '2026-12-01',
        adults: 1,
        cabin: 'economy',
      }),
    ).resolves.toEqual([]);
  });
});
