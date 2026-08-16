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

function kindLabel(kind: string): string {
  if (kind === 'note') return 'Note';
  if (kind === 'stay') return 'Stay';
  if (kind === 'activity') return 'Activity';
  return kind;
}

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
    <div className="space-y-10">
      <form
        onSubmit={rename}
        className="flex flex-col gap-3 rounded-[var(--travel-radius-xl)] bg-[var(--travel-color-surface-elevated)] p-5 shadow-[var(--travel-elevation-1)] sm:flex-row sm:items-end"
      >
        <Field id="trip-title" label="Trip name" className="flex-1">
          <Input
            id="trip-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            required
          />
        </Field>
        <Button type="submit" variant="secondary" disabled={pending}>
          Save name
        </Button>
        <Button type="button" variant="danger" disabled={pending} onClick={removeTrip}>
          Delete trip
        </Button>
      </form>

      <section>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="travel-caption">Itinerary</p>
            <h2 className="travel-h2 mt-1 text-[var(--travel-color-ink)]">
              {day?.label ?? 'Day 1'}
            </h2>
            <p className="mt-1 text-sm text-[var(--travel-color-ink-soft)]">
              Shape the day as ideas land — reorder anytime.
            </p>
          </div>
          <p className="text-xs text-[var(--travel-color-ink-muted)]">
            Updated {new Date(trip.updatedAt).toLocaleString('en-NZ')}
          </p>
        </div>

        {!day || day.items.length === 0 ? (
          <EmptyState
            className="mt-6"
            title="Your day is open"
            description="Add notes, places or activities — they’ll appear as a calm timeline."
          />
        ) : (
          <ol className="relative mt-8 space-y-0 border-l border-[var(--travel-color-ocean-soft)] pl-6">
            {day.items.map((item, index) => (
              <li key={item.id} className="relative pb-8 last:pb-0">
                <span
                  aria-hidden
                  className="absolute -left-[1.625rem] top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--travel-color-ocean)] text-[0.65rem] font-semibold text-white"
                >
                  {index + 1}
                </span>
                <div className="rounded-[var(--travel-radius-lg)] bg-[var(--travel-color-surface-elevated)] p-4 shadow-[var(--travel-elevation-1)] sm:flex sm:items-start sm:justify-between sm:gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--travel-color-ocean)]">
                      {kindLabel(item.kind)}
                      {item.refSlug ? ` · ${item.refSlug}` : ''}
                    </p>
                    <p className="mt-1 text-lg font-semibold text-[var(--travel-color-ink)]">
                      {item.title}
                    </p>
                    {item.notes ? (
                      <p className="mt-2 text-sm text-[var(--travel-color-ink-soft)]">
                        {item.notes}
                      </p>
                    ) : null}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 sm:mt-0">
                    <Button
                      type="button"
                      variant="ghost"
                      disabled={pending || index === 0}
                      onClick={() => moveItem(item.id, -1)}
                    >
                      Earlier
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      disabled={pending || index === day.items.length - 1}
                      onClick={() => moveItem(item.id, 1)}
                    >
                      Later
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={pending}
                      onClick={() => removeItem(item.id)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        )}

        <form
          onSubmit={addItem}
          className="mt-8 flex flex-col gap-3 rounded-[var(--travel-radius-xl)] border border-dashed border-[var(--travel-color-border-strong)] bg-[rgb(255_255_255_/0.55)] p-5 sm:flex-row sm:items-end"
        >
          <Field id="item-title" label="Add to this day" className="flex-1">
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
