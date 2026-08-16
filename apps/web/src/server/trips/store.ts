import type { ItineraryItemKind, Trip } from '@travel/domain';
import { tripRepository } from '../persistence/repos';

export async function listTripsForUser(userId: string): Promise<Trip[]> {
  return tripRepository().listForUser(userId);
}

export async function getTripForUser(tripId: string, userId: string): Promise<Trip> {
  return tripRepository().getForUser(tripId, userId);
}

export async function createTripForUser(userId: string, title: string): Promise<Trip> {
  return tripRepository().create(userId, title);
}

export async function renameTripForUser(
  tripId: string,
  userId: string,
  title: string,
): Promise<Trip> {
  return tripRepository().rename(tripId, userId, title);
}

export async function deleteTripForUser(tripId: string, userId: string): Promise<void> {
  return tripRepository().delete(tripId, userId);
}

export async function addItemForUser(
  tripId: string,
  userId: string,
  input: {
    dayId: string;
    kind: ItineraryItemKind;
    title: string;
    notes?: string | null;
    refSlug?: string | null;
  },
): Promise<Trip> {
  return tripRepository().addItem(tripId, userId, input);
}

export async function reorderItemsForUser(
  tripId: string,
  userId: string,
  dayId: string,
  orderedItemIds: readonly string[],
): Promise<Trip> {
  return tripRepository().reorderItems(tripId, userId, dayId, orderedItemIds);
}

export async function deleteItemForUser(
  tripId: string,
  userId: string,
  dayId: string,
  itemId: string,
): Promise<Trip> {
  return tripRepository().deleteItem(tripId, userId, dayId, itemId);
}
