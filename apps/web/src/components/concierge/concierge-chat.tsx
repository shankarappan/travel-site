'use client';

import { Button, Field, Input } from '@travel/ui';
import { useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState, type FormEvent } from 'react';

type Message = { id: string; role: string; content: string; toolName?: string };

const starters = [
  'Tell me about Rotorua',
  'Suggest a 3-day Queenstown itinerary',
  'Find somewhere romantic near a lake',
];

export function ConciergeChat() {
  const searchParams = useSearchParams();
  const bootstrapped = useRef(false);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function sendMessage(message: string) {
    const trimmed = message.trim();
    if (!trimmed) return;
    setPending(true);
    setError(null);
    try {
      const response = await fetch('/api/concierge', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ message: trimmed, conversationId }),
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

  useEffect(() => {
    if (bootstrapped.current) return;
    const preset = searchParams.get('q');
    if (preset) {
      bootstrapped.current = true;
      setInput(preset);
      void sendMessage(preset);
    }
  }, [searchParams]);

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    void sendMessage(input);
  }

  return (
    <div className="mx-auto grid max-w-4xl gap-6">
      <div className="min-h-[22rem] space-y-4 rounded-[var(--travel-radius-xl)] bg-[var(--travel-color-surface-elevated)] p-5 shadow-[var(--travel-elevation-2)] sm:p-7">
        {messages.length === 0 && !pending ? (
          <div className="space-y-4">
            <p className="text-[var(--travel-color-ink-soft)]">
              Ask about destinations, sketch an itinerary, or describe the trip you want. I won’t
              invent live prices or availability.
            </p>
            <div className="flex flex-wrap gap-2">
              {starters.map((starter) => (
                <button
                  key={starter}
                  type="button"
                  className="rounded-full border border-[var(--travel-color-border)] bg-[var(--travel-color-mist)] px-3.5 py-2 text-sm text-[var(--travel-color-ink)] transition-colors hover:border-[var(--travel-color-ocean)]"
                  onClick={() => void sendMessage(starter)}
                >
                  {starter}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages
            .filter((message) => message.role !== 'tool')
            .map((message) => {
              const isAssistant = message.role === 'assistant';
              return (
                <div
                  key={message.id}
                  className={`flex ${isAssistant ? 'justify-start' : 'justify-end'}`}
                >
                  <div
                    className={`max-w-[min(100%,36rem)] rounded-[1.1rem] px-4 py-3 text-sm leading-relaxed ${
                      isAssistant
                        ? 'bg-[var(--travel-color-ocean-soft)] text-[var(--travel-color-ink)]'
                        : 'bg-[var(--travel-color-ocean)] text-white'
                    }`}
                  >
                    <p className="travel-caption mb-1 opacity-70">
                      {isAssistant ? 'Concierge' : 'You'}
                    </p>
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>
              );
            })
        )}
        {pending ? (
          <p className="travel-thinking text-sm text-[var(--travel-color-ink-soft)]">
            Thinking through your request…
          </p>
        ) : null}
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <Field id="concierge-message" label="Ask your concierge" className="flex-1">
          <Input
            id="concierge-message"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Plan a calm week between lakes and wine country…"
            required
          />
        </Field>
        <Button type="submit" disabled={pending} className="min-h-11">
          {pending ? 'Sending…' : 'Send'}
        </Button>
      </form>
      {error ? <p className="text-sm text-[var(--travel-color-danger)]">{error}</p> : null}
    </div>
  );
}
