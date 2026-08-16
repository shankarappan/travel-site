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
    version: '0.1.0',
    system:
      'You are a New Zealand travel concierge. Use tools for facts. Never invent live prices or booking availability. Say when live inventory is disconnected.',
  },
];

export const getDestinationTool: ToolDefinition = {
  name: 'get_destination',
  description: 'Fetch curated destination content by slug',
  impact: 'read_only',
  requiresConfirmation: false,
  schema: z.object({
    slug: z.string().min(2),
  }),
};

export const readOnlyTools = [getDestinationTool] as const;

export function getPrompt(id: string): PromptDefinition | undefined {
  return promptRegistry.find((prompt) => prompt.id === id);
}

export function assertToolAllowed(toolName: string, allowed: readonly string[]): void {
  if (!allowed.includes(toolName)) {
    throw new Error(`Tool ${toolName} is not allow-listed`);
  }
}
