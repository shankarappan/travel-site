'use client';

import { Button, Field, Input } from '@travel/ui';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';

export function CreateTripForm() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const response = await fetch('/api/trips', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ title }),
      });
      const data = (await response.json()) as { trip?: { id: string }; error?: string };
      if (!response.ok || !data.trip) {
        setError(data.error ?? 'Could not create trip');
        return;
      }
      router.push(`/trips/${data.trip.id}`);
      router.refresh();
    } catch {
      setError('Network error');
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <Field id="new-trip-title" label="Trip name" className="flex-1">
        <Input
          id="new-trip-title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="South Island loop"
          required
        />
      </Field>
      <Button type="submit" disabled={pending}>
        {pending ? 'Creating…' : 'Create trip'}
      </Button>
      {error ? (
        <p role="alert" className="text-sm text-[var(--travel-color-danger)] sm:basis-full">
          {error}
        </p>
      ) : null}
    </form>
  );
}
