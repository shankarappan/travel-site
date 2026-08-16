import { describe, expect, it } from 'vitest';
import { cn } from './cn.js';

describe('cn', () => {
  it('joins truthy class names', () => {
    const optional = '';
    expect(cn('a', optional, 'c')).toBe('a c');
  });
});
