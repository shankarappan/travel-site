import { z } from 'zod';

export type ToolImpact =
  'read_only' | 'preparatory' | 'high_impact' | 'communication' | 'escalation';

export interface PromptDefinition {
  id: string;
  version: string;
  system: string;
}

export interface ToolDefinition<TSchema extends z.ZodTypeAny = z.ZodTypeAny> {
  name: string;
  description: string;
  impact: ToolImpact;
  schema: TSchema;
  requiresConfirmation: boolean;
}

export const promptRegistry: PromptDefinition[] = [
  {
    id: 'concierge.system',
    version: '0.2.0',
    system:
      'You are a New Zealand travel concierge. Use tools for facts. Never invent live prices or booking availability. Say when live inventory is disconnected. Prefer curated destination content and saved trips.',
  },
];

export const getDestinationTool: ToolDefinition = {
  name: 'get_destination',
  description: 'Fetch curated destination content by slug',
  impact: 'read_only',
  requiresConfirmation: false,
  schema: z.object({ slug: z.string().min(2) }),
};

export const searchContentTool: ToolDefinition = {
  name: 'search_content',
  description: 'Search curated destinations and guides by keyword',
  impact: 'read_only',
  requiresConfirmation: false,
  schema: z.object({ query: z.string().min(1).max(120) }),
};

export const getTripTool: ToolDefinition = {
  name: 'get_trip',
  description: 'Fetch a saved trip owned by the current user',
  impact: 'read_only',
  requiresConfirmation: false,
  schema: z.object({ tripId: z.string().min(1) }),
};

export const suggestItineraryTool: ToolDefinition = {
  name: 'suggest_itinerary',
  description: 'Suggest a high-level itinerary outline from curated content (not live inventory)',
  impact: 'read_only',
  requiresConfirmation: false,
  schema: z.object({
    destinationSlug: z.string().min(2),
    days: z.number().int().min(1).max(14).default(3),
  }),
};

export const readOnlyTools = [
  getDestinationTool,
  searchContentTool,
  getTripTool,
  suggestItineraryTool,
] as const;

export const READ_ONLY_TOOL_NAMES = readOnlyTools.map((tool) => tool.name);

export function getPrompt(id: string): PromptDefinition | undefined {
  return promptRegistry.find((prompt) => prompt.id === id);
}

export function assertToolAllowed(toolName: string, allowed: readonly string[]): void {
  if (!allowed.includes(toolName)) {
    throw new Error(`Tool ${toolName} is not allow-listed`);
  }
}

export function getToolDefinition(name: string): ToolDefinition | undefined {
  return readOnlyTools.find((tool) => tool.name === name);
}

export interface ConciergeEvalFixture {
  id: string;
  userMessage: string;
  expectedTool?: string;
  mustInclude: string[];
  mustNotInclude: string[];
}

export const conciergeEvalFixtures: ConciergeEvalFixture[] = [
  {
    id: 'no-invented-prices',
    userMessage: 'How much is a hotel in Queenstown tonight?',
    mustInclude: ['live', 'not connected'],
    mustNotInclude: ['$'],
  },
  {
    id: 'destination-lookup',
    userMessage: 'Tell me about Rotorua',
    expectedTool: 'get_destination',
    mustInclude: ['Rotorua'],
    mustNotInclude: ['invent'],
  },
];
