import {
  assertToolAllowed,
  getPrompt,
  getToolDefinition,
  READ_ONLY_TOOL_NAMES,
  type ConciergeEvalFixture,
} from '@travel/ai';
import type { ConversationRecord as PersistedConversation } from '@travel/db';
import { createLogger } from '@travel/observability';
import { catalogRepository } from '../catalog/file-repository';
import { conversationRepository } from '../persistence/repos';
import { getTripForUser, listTripsForUser } from '../trips/store';

const logger = createLogger({ service: 'concierge' });

export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant' | 'tool';
  content: string;
  toolName?: string;
  createdAt: string;
}

export interface ConversationRecord {
  id: string;
  userId: string | null;
  messages: ConversationMessage[];
  createdAt: string;
  updatedAt: string;
}

const rateBuckets = new Map<string, { count: number; resetAt: number }>();

export function resetConciergeStore(): void {
  rateBuckets.clear();
}

function rateLimit(key: string, limit = 30, windowMs = 60_000): void {
  const now = Date.now();
  const bucket = rateBuckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    rateBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }
  if (bucket.count >= limit) {
    throw new Error('Rate limit exceeded');
  }
  bucket.count += 1;
}

function toUiConversation(record: PersistedConversation): ConversationRecord {
  return {
    id: record.id,
    userId: record.userId,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    messages: record.messages.map((message) => ({
      id: message.id,
      role: (message.role === 'assistant' || message.role === 'tool' ? message.role : 'user') as
        | 'user'
        | 'assistant'
        | 'tool',
      content: message.body,
      toolName: message.toolName ?? undefined,
      createdAt: message.createdAt,
    })),
  };
}

async function appendUiMessage(
  conversationId: string,
  message: {
    role: 'user' | 'assistant' | 'tool';
    content: string;
    toolName?: string;
    direction?: 'inbound' | 'outbound' | null;
  },
): Promise<ConversationRecord> {
  const persisted = await conversationRepository().appendMessage(conversationId, {
    role: message.role,
    direction:
      message.direction ??
      (message.role === 'user' ? 'inbound' : message.role === 'assistant' ? 'outbound' : null),
    body: message.content,
    toolName: message.toolName ?? null,
  });
  return toUiConversation(persisted);
}

async function runTool(
  name: string,
  args: Record<string, unknown>,
  userId: string | null,
): Promise<unknown> {
  assertToolAllowed(name, READ_ONLY_TOOL_NAMES);
  const definition = getToolDefinition(name);
  if (!definition) {
    throw new Error(`Unknown tool: ${name}`);
  }
  const parsed = definition.schema.parse(args);

  switch (name) {
    case 'get_destination': {
      const slug = String((parsed as { slug: string }).slug);
      return catalogRepository.getDestination(slug);
    }
    case 'search_content': {
      const query = String((parsed as { query: string }).query).toLowerCase();
      const destinations = await catalogRepository.listDestinations();
      const guides = await catalogRepository.listGuides();
      return {
        destinations: destinations.filter(
          (item) =>
            item.name.toLowerCase().includes(query) ||
            item.summary.toLowerCase().includes(query) ||
            item.region.toLowerCase().includes(query),
        ),
        guides: guides.filter(
          (item) =>
            item.title.toLowerCase().includes(query) || item.dek.toLowerCase().includes(query),
        ),
      };
    }
    case 'get_trip': {
      if (!userId) {
        return { error: 'Sign in required to read private trips' };
      }
      const tripId = String((parsed as { tripId: string }).tripId);
      return getTripForUser(tripId, userId);
    }
    case 'suggest_itinerary': {
      const { destinationSlug, days } = parsed as { destinationSlug: string; days: number };
      const destination = await catalogRepository.getDestination(destinationSlug);
      if (!destination) {
        return { error: 'Destination not found in curated catalog' };
      }
      return {
        destination: destination.name,
        days: Array.from({ length: days }, (_, index) => ({
          day: index + 1,
          suggestion: destination.highlights[index % destination.highlights.length],
        })),
        disclaimer: 'Editorial suggestion only. Live availability is not connected.',
      };
    }
    default:
      throw new Error(`Unhandled tool: ${name}`);
  }
}

function detectTool(message: string): { name: string; args: Record<string, unknown> } | null {
  const lower = message.toLowerCase();
  if (lower.includes('trip') && /trip_[a-z0-9-]+/i.test(message)) {
    const match = message.match(/trip_[a-z0-9-]+/i);
    return { name: 'get_trip', args: { tripId: match?.[0] } };
  }
  if (lower.includes('suggest') || lower.includes('itinerary')) {
    if (lower.includes('rotorua'))
      return { name: 'suggest_itinerary', args: { destinationSlug: 'rotorua', days: 3 } };
    if (lower.includes('wellington'))
      return { name: 'suggest_itinerary', args: { destinationSlug: 'wellington', days: 3 } };
    if (lower.includes('fiordland'))
      return { name: 'suggest_itinerary', args: { destinationSlug: 'fiordland', days: 3 } };
    return { name: 'suggest_itinerary', args: { destinationSlug: 'queenstown', days: 3 } };
  }
  if (lower.includes('rotorua')) return { name: 'get_destination', args: { slug: 'rotorua' } };
  if (lower.includes('wellington'))
    return { name: 'get_destination', args: { slug: 'wellington' } };
  if (lower.includes('fiordland')) return { name: 'get_destination', args: { slug: 'fiordland' } };
  if (lower.includes('queenstown'))
    return { name: 'get_destination', args: { slug: 'queenstown' } };
  if (lower.includes('search') || lower.includes('find')) {
    return { name: 'search_content', args: { query: message.slice(0, 80) } };
  }
  return null;
}

export async function handleConciergeTurn(input: {
  conversationId?: string;
  userId: string | null;
  message: string;
}): Promise<{ conversation: ConversationRecord; reply: string }> {
  rateLimit(input.userId ?? 'anonymous');
  const prompt = getPrompt('concierge.system');
  const repo = conversationRepository();

  let conversation: ConversationRecord;
  if (input.conversationId) {
    const existing = await repo.get(input.conversationId);
    if (!existing) {
      throw new Error('Conversation not found');
    }
    conversation = toUiConversation(existing);
  } else {
    const created = await repo.create({
      userId: input.userId,
      channel: 'web',
      externalId: `web_${crypto.randomUUID()}`,
    });
    conversation = toUiConversation(created);
  }

  conversation = await appendUiMessage(conversation.id, {
    role: 'user',
    content: input.message,
    direction: 'inbound',
  });

  let reply: string;
  const priceAsk = /price|how much|cost|\$/i.test(input.message);
  if (priceAsk) {
    reply =
      'Live stay prices and availability are not connected yet. I can share curated destination guidance, but I will not invent rates.';
  } else {
    const toolCall = detectTool(input.message);
    if (toolCall) {
      const result = await runTool(toolCall.name, toolCall.args, input.userId);
      conversation = await appendUiMessage(conversation.id, {
        role: 'tool',
        content: JSON.stringify(result),
        toolName: toolCall.name,
        direction: null,
      });
      logger.info('concierge.tool_call', {
        tool: toolCall.name,
        promptVersion: prompt?.version,
        conversationId: conversation.id,
      });
      reply = `Using ${toolCall.name} (prompt ${prompt?.version ?? 'n/a'}):\n${summarizeToolResult(toolCall.name, result)}`;
    } else if (input.userId) {
      const trips = await listTripsForUser(input.userId);
      reply = `I can look up destinations, search curated guides, fetch your trips (${trips.length} saved), or suggest an editorial itinerary. Live inventory remains disconnected.`;
    } else {
      reply =
        'Ask about a New Zealand destination, search curated guides, or sign in so I can read your saved trips. Live inventory remains disconnected.';
    }
  }

  conversation = await appendUiMessage(conversation.id, {
    role: 'assistant',
    content: reply,
    direction: 'outbound',
  });
  return { conversation, reply };
}

function summarizeToolResult(toolName: string, result: unknown): string {
  if (!result) return 'No curated content found.';
  if (toolName === 'get_destination' && result && typeof result === 'object' && 'name' in result) {
    const destination = result as { name: string; summary: string };
    return `${destination.name}: ${destination.summary}`;
  }
  if (toolName === 'suggest_itinerary' && result && typeof result === 'object') {
    const suggestion = result as {
      destination: string;
      disclaimer: string;
      days: Array<{ day: number; suggestion: string }>;
    };
    return `${suggestion.destination} outline — ${suggestion.days.map((day) => `Day ${day.day}: ${day.suggestion}`).join('; ')}. ${suggestion.disclaimer}`;
  }
  return JSON.stringify(result).slice(0, 500);
}

export function evaluateFixture(fixture: ConciergeEvalFixture, reply: string): boolean {
  const lower = reply.toLowerCase();
  const includesOk = fixture.mustInclude.every((token) => lower.includes(token.toLowerCase()));
  const excludesOk = fixture.mustNotInclude.every((token) => !reply.includes(token));
  return includesOk && excludesOk;
}
