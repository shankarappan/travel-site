import { describe, expect, it } from 'vitest';
import { assertPositiveMoney, canTransitionOrder, transitionOrder } from './index.js';

describe('assertPositiveMoney', () => {
  it('accepts valid NZD amounts', () => {
    expect(() => assertPositiveMoney({ amountMinor: 12999, currency: 'NZD' })).not.toThrow();
  });

  it('rejects fractional minor units', () => {
    expect(() => assertPositiveMoney({ amountMinor: 12.5, currency: 'NZD' })).toThrow();
  });
});

describe('order transitions', () => {
  it('allows draft to quoted', () => {
    expect(canTransitionOrder('DRAFT', 'QUOTED')).toBe(true);
    expect(transitionOrder('DRAFT', 'QUOTED')).toBe('QUOTED');
  });

  it('blocks confirmed to draft', () => {
    expect(canTransitionOrder('CONFIRMED', 'DRAFT')).toBe(false);
    expect(() => transitionOrder('CONFIRMED', 'DRAFT')).toThrow(/Illegal order transition/);
  });
});
