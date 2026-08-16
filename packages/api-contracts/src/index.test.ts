import { describe, expect, it } from 'vitest';
import { parseStaySearch } from './index.js';

describe('parseStaySearch', () => {
  it('parses a valid NZ stay search', () => {
    const result = parseStaySearch({
      destination: 'Queenstown',
      checkIn: '2026-12-01',
      checkOut: '2026-12-05',
      adults: 2,
    });
    expect(result.currency).toBe('NZD');
    expect(result.children).toBe(0);
  });

  it('rejects empty destinations', () => {
    expect(() =>
      parseStaySearch({
        destination: '',
        checkIn: '2026-12-01',
        checkOut: '2026-12-05',
        adults: 2,
      }),
    ).toThrow();
  });
});
