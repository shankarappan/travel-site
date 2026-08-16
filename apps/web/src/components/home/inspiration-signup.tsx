'use client';

import { Button, Field, Input } from '@travel/ui';
import { useState, type FormEvent } from 'react';

export function InspirationSignup() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setStatus(null);
    try {
      const response = await fetch('/api/marketing/subscribe', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, campaign: 'homepage_inspiration' }),
      });
      const data = (await response.json()) as { error?: string; ok?: boolean };
      if (response.status === 401) {
        setStatus('Sign in and enable travel inspiration emails in your preferences first.');
        return;
      }
      if (!response.ok) {
        setStatus(data.error ?? 'Unable to subscribe right now.');
        return;
      }
      setStatus('You’re on the list — inspiration only, never spam.');
      setEmail('');
    } catch {
      setStatus('Network error. Please try again.');
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <Field id="inspiration-email" label="Email" className="flex-1">
        <Input
          id="inspiration-email"
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
        />
      </Field>
      <Button type="submit" disabled={pending} className="min-h-11">
        {pending ? 'Saving…' : 'Get inspiration'}
      </Button>
      {status ? (
        <p className="text-sm text-[var(--travel-color-ink-soft)] sm:basis-full">{status}</p>
      ) : null}
    </form>
  );
}
