import {
  addItineraryItem,
  assertTripOwner,
  createTrip,
  deleteItineraryItem,
  renameTrip,
  reorderItineraryItems,
  TripNotFoundError,
  type ItineraryItemKind,
  type Trip,
} from '@travel/domain';

const trips = new Map<string, Trip>();

export function resetTripStore(): void {
  trips.clear();
}

export function listTripsForUser(userId: string): Trip[] {
  return [...trips.values()]
    .filter((trip) => trip.ownerId.value === userId)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function getTripForUser(tripId: string, userId: string): Trip {
  const trip = trips.get(tripId);
  if (!trip) {
    throw new TripNotFoundError(tripId);
  }
  assertTripOwner(trip, userId);
  return trip;
}

export function createTripForUser(userId: string, title: string): Trip {
  const trip = createTrip({ ownerId: userId, title });
  trips.set(trip.id, trip);
  return trip;
}

export function renameTripForUser(tripId: string, userId: string, title: string): Trip {
  const current = getTripForUser(tripId, userId);
  const next = renameTrip(current, title);
  trips.set(next.id, next);
  return next;
}

export function deleteTripForUser(tripId: string, userId: string): void {
  getTripForUser(tripId, userId);
  trips.delete(tripId);
}

export function addItemForUser(
  tripId: string,
  userId: string,
  input: {
    dayId: string;
    kind: ItineraryItemKind;
    title: string;
    notes?: string | null;
    refSlug?: string | null;
  },
): Trip {
  const current = getTripForUser(tripId, userId);
  const next = addItineraryItem(current, input.dayId, input);
  trips.set(next.id, next);
  return next;
}

export function reorderItemsForUser(
  tripId: string,
  userId: string,
  dayId: string,
  orderedItemIds: readonly string[],
): Trip {
  const current = getTripForUser(tripId, userId);
  const next = reorderItineraryItems(current, dayId, orderedItemIds);
  trips.set(next.id, next);
  return next;
}

export function deleteItemForUser(
  tripId: string,
  userId: string,
  dayId: string,
  itemId: string,
): Trip {
  const current = getTripForUser(tripId, userId);
  const next = deleteItineraryItem(current, dayId, itemId);
  trips.set(next.id, next);
  return next;
}
