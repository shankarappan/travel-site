import { createUserId, type UserId } from './user.js';

export type ItineraryItemKind = 'note' | 'stay' | 'activity' | 'transport' | 'destination';

export interface ItineraryItem {
  readonly id: string;
  readonly kind: ItineraryItemKind;
  readonly title: string;
  readonly notes: string | null;
  readonly refSlug: string | null;
  readonly sortOrder: number;
}

export interface TripDay {
  readonly id: string;
  readonly label: string;
  readonly sortOrder: number;
  readonly items: readonly ItineraryItem[];
}

export interface Trip {
  readonly id: string;
  readonly ownerId: UserId;
  readonly title: string;
  readonly days: readonly TripDay[];
  readonly createdAt: string;
  readonly updatedAt: string;
}

export class TripOwnershipError extends Error {
  constructor(message = 'Trip ownership check failed') {
    super(message);
    this.name = 'TripOwnershipError';
  }
}

export class TripNotFoundError extends Error {
  constructor(tripId: string) {
    super(`Trip not found: ${tripId}`);
    this.name = 'TripNotFoundError';
  }
}

export function assertTripOwner(trip: Trip, userId: string): void {
  if (trip.ownerId.value !== userId) {
    throw new TripOwnershipError();
  }
}

export function createTrip(input: {
  id?: string;
  ownerId: string;
  title: string;
  now?: Date;
}): Trip {
  const title = input.title.trim();
  if (!title) {
    throw new Error('Trip title cannot be empty');
  }
  const now = (input.now ?? new Date()).toISOString();
  return {
    id: input.id ?? cryptoRandomId('trip'),
    ownerId: createUserId(input.ownerId),
    title,
    days: [
      {
        id: cryptoRandomId('day'),
        label: 'Day 1',
        sortOrder: 0,
        items: [],
      },
    ],
    createdAt: now,
    updatedAt: now,
  };
}

export function renameTrip(trip: Trip, title: string, now: Date = new Date()): Trip {
  const next = title.trim();
  if (!next) {
    throw new Error('Trip title cannot be empty');
  }
  return { ...trip, title: next, updatedAt: now.toISOString() };
}

export function addItineraryItem(
  trip: Trip,
  dayId: string,
  input: {
    kind: ItineraryItemKind;
    title: string;
    notes?: string | null;
    refSlug?: string | null;
  },
  now: Date = new Date(),
): Trip {
  const title = input.title.trim();
  if (!title) {
    throw new Error('Itinerary item title cannot be empty');
  }

  if (!trip.days.some((day) => day.id === dayId)) {
    throw new Error(`Trip day not found: ${dayId}`);
  }

  const days = trip.days.map((day) => {
    if (day.id !== dayId) return day;
    const sortOrder = day.items.length;
    const item: ItineraryItem = {
      id: cryptoRandomId('item'),
      kind: input.kind,
      title,
      notes: input.notes?.trim() || null,
      refSlug: input.refSlug?.trim() || null,
      sortOrder,
    };
    return { ...day, items: [...day.items, item] };
  });

  return { ...trip, days, updatedAt: now.toISOString() };
}

export function reorderItineraryItems(
  trip: Trip,
  dayId: string,
  orderedItemIds: readonly string[],
  now: Date = new Date(),
): Trip {
  const days = trip.days.map((day) => {
    if (day.id !== dayId) return day;
    if (orderedItemIds.length !== day.items.length) {
      throw new Error('Reorder payload must include every item exactly once');
    }
    const byId = new Map(day.items.map((item) => [item.id, item]));
    const items = orderedItemIds.map((id, sortOrder) => {
      const item = byId.get(id);
      if (!item) {
        throw new Error(`Unknown itinerary item id: ${id}`);
      }
      return { ...item, sortOrder };
    });
    return { ...day, items };
  });

  if (!trip.days.some((day) => day.id === dayId)) {
    throw new Error(`Trip day not found: ${dayId}`);
  }

  return { ...trip, days, updatedAt: now.toISOString() };
}

export function deleteItineraryItem(
  trip: Trip,
  dayId: string,
  itemId: string,
  now: Date = new Date(),
): Trip {
  if (!trip.days.some((day) => day.id === dayId)) {
    throw new Error(`Trip day not found: ${dayId}`);
  }

  const days = trip.days.map((day) => {
    if (day.id !== dayId) return day;
    const filtered = day.items.filter((item) => item.id !== itemId);
    if (filtered.length === day.items.length) {
      throw new Error(`Itinerary item not found: ${itemId}`);
    }
    return {
      ...day,
      items: filtered.map((item, sortOrder) => ({ ...item, sortOrder })),
    };
  });

  return { ...trip, days, updatedAt: now.toISOString() };
}

function cryptoRandomId(prefix: string): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}
