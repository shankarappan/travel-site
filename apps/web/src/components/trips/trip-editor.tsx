'use client';

import { Button, EmptyState, Field, Input } from '@travel/ui';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';

type TripItem = {
  id: string;
  kind: string;
  title: string;
  notes: string | null;
  refSlug: string | null;
  sortOrder: number;
};

type TripDay = {
  id: string;
  label: string;
  sortOrder: number;
  items: TripItem[];
};

export type TripView = {
  id: string;
  title: string;
  days: TripDay[];
  updatedAt: string;
};

export function TripEditor({ initialTrip }: { initialTrip: TripView }) {
  const router = useRouter();
  const [trip, setTrip] = useState(initialTrip);
  const [title, setTitle] = useState(initialTrip.title);
  const [itemTitle, setItemTitle] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const day = trip.days[0];

  async function rename(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/trips/${trip.id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ title }),
      });
      const data = (await response.json()) as { trip?: TripView; error?: string };
      if (!response.ok || !data.trip) {
        setMessage(data.error ?? 'Rename failed');
        return;
      }
      setTrip(data.trip);
      setMessage('Trip renamed');
      router.refresh();
    } catch {
      setMessage('Network error');
    } finally {
      setPending(false);
    }
  }

  async function addItem(event: FormEvent) {
    event.preventDefault();
    if (!day) return;
    setPending(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/trips/${trip.id}/items`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ dayId: day.id, kind: 'note', title: itemTitle }),
      });
      const data = (await response.json()) as { trip?: TripView; error?: string };
      if (!response.ok || !data.trip) {
        setMessage(data.error ?? 'Could not add item');
        return;
      }
      setTrip(data.trip);
      setItemTitle('');
      router.refresh();
    } catch {
      setMessage('Network error');
    } finally {
      setPending(false);
    }
  }

  async function moveItem(itemId: string, direction: -1 | 1) {
    if (!day) return;
    const ids = day.items.map((item) => item.id);
    const index = ids.indexOf(itemId);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= ids.length) return;
    const next = [...ids];
    const [removed] = next.splice(index, 1);
    next.splice(target, 0, removed!);

    setPending(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/trips/${trip.id}/items/reorder`, {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ dayId: day.id, orderedItemIds: next }),
      });
      const data = (await response.json()) as { trip?: TripView; error?: string };
      if (!response.ok || !data.trip) {
        setMessage(data.error ?? 'Reorder failed');
        return;
      }
      setTrip(data.trip);
      router.refresh();
    } catch {
      setMessage('Network error');
    } finally {
      setPending(false);
    }
  }

  async function removeItem(itemId: string) {
    if (!day) return;
    setPending(true);
    setMessage(null);
    try {
      const response = await fetch(
        `/api/trips/${trip.id}/items/${itemId}?dayId=${encodeURIComponent(day.id)}`,
        { method: 'DELETE' },
      );
      const data = (await response.json()) as { trip?: TripView; error?: string };
      if (!response.ok || !data.trip) {
        setMessage(data.error ?? 'Delete failed');
        return;
      }
      setTrip(data.trip);
      router.refresh();
    } catch {
      setMessage('Network error');
    } finally {
      setPending(false);
    }
  }

  async function removeTrip() {
    if (!window.confirm('Delete this trip? This cannot be undone.')) return;
    setPending(true);
    try {
      const response = await fetch(`/api/trips/${trip.id}`, { method: 'DELETE' });
      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        setMessage(data.error ?? 'Could not delete trip');
        return;
      }
      router.push('/trips');
      router.refresh();
    } catch {
      setMessage('Network error');
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-8">
      <form onSubmit={rename} className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <Field id="trip-title" label="Trip name" className="flex-1">
          <Input
            id="trip-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            required
          />
        </Field>
        <Button type="submit" variant="secondary" disabled={pending}>
          Rename
        </Button>
        <Button type="button" variant="danger" disabled={pending} onClick={removeTrip}>
          Delete trip
        </Button>
      </form>

      <section>
        <h2 className="font-[family-name:var(--travel-font-display)] text-xl font-semibold">
          {day?.label ?? 'Day 1'}
        </h2>
        <p className="mt-1 text-sm text-[var(--travel-color-ink-soft)]">
          Share/export comes later. Reorder uses confirmed server updates (no optimistic UI).
        </p>

        {!day || day.items.length === 0 ? (
          <EmptyState
            className="mt-4"
            title="No itinerary items yet"
            description="Add notes, destinations or activities for this day."
          />
        ) : (
          <ol className="mt-4 space-y-3">
            {day.items.map((item, index) => (
              <li
                key={item.id}
                className="flex flex-col gap-2 border border-[var(--travel-color-border)] bg-[var(--travel-color-surface-elevated)] p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-semibold text-[var(--travel-color-ink)]">{item.title}</p>
                  <p className="text-xs uppercase tracking-[0.12em] text-[var(--travel-color-ink-soft)]">
                    {item.kind}
                    {item.refSlug ? ` · ${item.refSlug}` : ''}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={pending || index === 0}
                    onClick={() => moveItem(item.id, -1)}
                  >
                    Up
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={pending || index === day.items.length - 1}
                    onClick={() => moveItem(item.id, 1)}
                  >
                    Down
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={pending}
                    onClick={() => removeItem(item.id)}
                  >
                    Delete
                  </Button>
                </div>
              </li>
            ))}
          </ol>
        )}

        <form onSubmit={addItem} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
          <Field id="item-title" label="Add item" className="flex-1">
            <Input
              id="item-title"
              value={itemTitle}
              onChange={(event) => setItemTitle(event.target.value)}
              placeholder="Lake walk at dawn"
              required
            />
          </Field>
          <Button type="submit" disabled={pending || !day}>
            Add to day
          </Button>
        </form>
      </section>

      {message ? <p className="text-sm text-[var(--travel-color-ink-soft)]">{message}</p> : null}
    </div>
  );
}
