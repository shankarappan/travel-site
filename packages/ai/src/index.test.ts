import { describe, expect, it } from 'vitest';
import {
  assertToolAllowed,
  conciergeEvalFixtures,
  getPrompt,
  getToolDefinition,
  READ_ONLY_TOOL_NAMES,
  readOnlyTools,
} from './index.js';

describe('AI registry', () => {
  it('exposes a versioned concierge prompt', () => {
    const prompt = getPrompt('concierge.system');
    expect(prompt?.version).toBe('0.2.0');
    expect(prompt?.system).toMatch(/Never invent live prices/i);
  });

  it('registers read-only tools without confirmation', () => {
    expect(readOnlyTools.map((tool) => tool.name)).toEqual([
      'get_destination',
      'search_content',
      'get_trip',
      'suggest_itinerary',
    ]);
    expect(readOnlyTools.every((tool) => tool.impact === 'read_only')).toBe(true);
    expect(readOnlyTools.every((tool) => !tool.requiresConfirmation)).toBe(true);
  });

  it('blocks tools outside the allow-list', () => {
    expect(() => assertToolAllowed('charge_payment', READ_ONLY_TOOL_NAMES)).toThrow(/allow-listed/);
  });

  it('includes eval fixtures that forbid invented prices', () => {
    const fixture = conciergeEvalFixtures.find((item) => item.id === 'no-invented-prices');
    expect(fixture?.mustNotInclude).toContain('$');
    expect(getToolDefinition('get_destination')?.name).toBe('get_destination');
  });
});
