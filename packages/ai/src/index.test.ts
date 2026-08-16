import { describe, expect, it } from 'vitest';
import { assertToolAllowed, getPrompt, readOnlyTools } from './index.js';

describe('AI registry', () => {
  it('exposes a versioned concierge prompt', () => {
    const prompt = getPrompt('concierge.system');
    expect(prompt?.version).toBe('0.1.0');
    expect(prompt?.system).toMatch(/Never invent live prices/i);
  });

  it('treats get_destination as read-only', () => {
    expect(readOnlyTools[0]?.impact).toBe('read_only');
    expect(readOnlyTools[0]?.requiresConfirmation).toBe(false);
  });

  it('blocks tools outside the allow-list', () => {
    expect(() => assertToolAllowed('charge_payment', ['get_destination'])).toThrow(/allow-listed/);
  });
});
