import { TripOwnershipError } from '@travel/domain';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  addItemForUser,
  createTripForUser,
  deleteItemForUser,
  getTripForUser,
  listTripsForUser,
  renameTripForUser,
  reorderItemsForUser,
  resetTripStore,
} from './store';

describe('trip store ownership', () => {
  beforeEach(() => {
    resetTripStore();
  });

  it('scopes list and mutations to the owning user', () => {
    const mine = createTripForUser('user_a', 'Mine');
    createTripForUser('user_b', 'Theirs');
    expect(listTripsForUser('user_a')).toHaveLength(1);
    expect(listTripsForUser('user_a')[0]?.id).toBe(mine.id);

    expect(() => getTripForUser(mine.id, 'user_b')).toThrow(TripOwnershipError);

    const renamed = renameTripForUser(mine.id, 'user_a', 'Renamed');
    expect(renamed.title).toBe('Renamed');

    const dayId = renamed.days[0]!.id;
    addItemForUser(mine.id, 'user_a', {
      dayId,
      kind: 'note',
      title: 'First',
    });
    const second = addItemForUser(mine.id, 'user_a', {
      dayId,
      kind: 'note',
      title: 'Second',
    });
    const ids = second.days[0]!.items.map((item) => item.id);
    const reordered = reorderItemsForUser(mine.id, 'user_a', dayId, [ids[1]!, ids[0]!]);
    expect(reordered.days[0]!.items[0]!.title).toBe('Second');
    const deleted = deleteItemForUser(mine.id, 'user_a', dayId, ids[1]!);
    expect(deleted.days[0]!.items).toHaveLength(1);
    expect(deleted.days[0]!.items[0]!.id).toBe(ids[0]);
  });
});
