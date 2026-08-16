import { describe, expect, it } from 'vitest';
import {
  addItineraryItem,
  assertTripOwner,
  createTrip,
  deleteItineraryItem,
  renameTrip,
  reorderItineraryItems,
  TripOwnershipError,
} from './index.js';

describe('trips', () => {
  it('creates a trip with a default day for an owner', () => {
    const trip = createTrip({ ownerId: 'user_1', title: ' South Island loop ' });
    expect(trip.title).toBe('South Island loop');
    expect(trip.ownerId.value).toBe('user_1');
    expect(trip.days).toHaveLength(1);
  });

  it('enforces ownership', () => {
    const trip = createTrip({ ownerId: 'user_1', title: 'North Island' });
    expect(() => assertTripOwner(trip, 'user_2')).toThrow(TripOwnershipError);
  });

  it('renames, adds, reorders and deletes itinerary items', () => {
    let trip = createTrip({ ownerId: 'user_1', title: 'Queenstown weekend' });
    const dayId = trip.days[0]!.id;
    trip = renameTrip(trip, 'Queenstown long weekend');
    trip = addItineraryItem(trip, dayId, { kind: 'note', title: 'Lake walk' });
    trip = addItineraryItem(trip, dayId, {
      kind: 'destination',
      title: 'Queenstown',
      refSlug: 'queenstown',
    });
    const first = trip.days[0]!.items[0]!.id;
    const second = trip.days[0]!.items[1]!.id;
    trip = reorderItineraryItems(trip, dayId, [second, first]);
    expect(trip.days[0]!.items.map((item) => item.id)).toEqual([second, first]);
    trip = deleteItineraryItem(trip, dayId, second);
    expect(trip.days[0]!.items).toHaveLength(1);
    expect(trip.days[0]!.items[0]!.id).toBe(first);
  });
});
