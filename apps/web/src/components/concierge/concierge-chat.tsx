'use client';

import { Button, Field, Input } from '@travel/ui';
import { useState, type FormEvent } from 'react';

type Message = { id: string; role: string; content: string; toolName?: string };

export function ConciergeChat() {
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const response = await fetch('/api/concierge', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ message: input, conversationId }),
      });
      const data = (await response.json()) as {
        conversationId?: string;
        reply?: string;
        messages?: Message[];
        error?: string;
      };
      if (!response.ok) {
        setError(data.error ?? 'Concierge unavailable');
        return;
      }
      setConversationId(data.conversationId);
      setMessages(data.messages ?? []);
      setInput('');
    } catch {
      setError('Network error');
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="min-h-64 space-y-3 border border-[var(--travel-color-border)] bg-[var(--travel-color-surface-elevated)] p-4">
        {messages.length === 0 ? (
          <p className="text-sm text-[var(--travel-color-ink-soft)]">
            Ask about destinations, guides, or itinerary ideas. Live prices are never invented.
          </p>
        ) : (
          messages
            .filter((message) => message.role !== 'tool')
            .map((message) => (
              <div key={message.id} className="text-sm">
                <p className="font-semibold uppercase tracking-[0.12em] text-[var(--travel-color-ink-soft)]">
                  {message.role}
                </p>
                <p className="mt-1 whitespace-pre-wrap text-[var(--travel-color-ink)]">
                  {message.content}
                </p>
              </div>
            ))
        )}
      </div>
      <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <Field id="concierge-message" label="Message" className="flex-1">
          <Input
            id="concierge-message"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Tell me about Queenstown"
            required
          />
        </Field>
        <Button type="submit" disabled={pending}>
          {pending ? 'Thinking…' : 'Send'}
        </Button>
      </form>
      {error ? <p className="text-sm text-[var(--travel-color-danger)]">{error}</p> : null}
    </div>
  );
}
