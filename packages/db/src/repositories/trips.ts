import {
  addItineraryItem,
  assertTripOwner,
  createTrip,
  createUserId,
  deleteItineraryItem,
  renameTrip,
  reorderItineraryItems,
  TripNotFoundError,
  type ItineraryItem,
  type ItineraryItemKind,
  type Trip,
  type TripDay,
} from '@travel/domain';
import type { DbPool } from '../pool.js';
import type { TripRepository } from './types.js';

type TripRow = {
  id: string;
  owner_id: string;
  title: string;
  status: string;
  created_at: Date;
  updated_at: Date;
};

type DayRow = {
  id: string;
  label: string;
  sort_order: number;
};

type ItemRow = {
  id: string;
  day_id: string;
  kind: ItineraryItemKind;
  title: string;
  notes: string | null;
  ref_slug: string | null;
  sort_order: number;
};

export class PostgresTripRepository implements TripRepository {
  constructor(private readonly pool: DbPool) {}

  private async loadTrip(tripId: string): Promise<Trip | null> {
    const tripResult = await this.pool.query<TripRow>(`SELECT * FROM trips WHERE id = $1`, [tripId]);
    const trip = tripResult.rows[0];
    if (!trip) return null;

    const daysResult = await this.pool.query<DayRow>(
      `SELECT id, label, sort_order FROM trip_days WHERE trip_id = $1 ORDER BY sort_order`,
      [tripId],
    );
    const itemsResult = await this.pool.query<ItemRow>(
      `
      SELECT i.id, i.day_id, i.kind, i.title, i.notes, i.ref_slug, i.sort_order
      FROM itinerary_items i
      INNER JOIN trip_days d ON d.id = i.day_id
      WHERE d.trip_id = $1
      ORDER BY i.sort_order
      `,
      [tripId],
    );

    const itemsByDay = new Map<string, ItineraryItem[]>();
    for (const item of itemsResult.rows) {
      const list = itemsByDay.get(item.day_id) ?? [];
      list.push({
        id: item.id,
        kind: item.kind,
        title: item.title,
        notes: item.notes,
        refSlug: item.ref_slug,
        sortOrder: item.sort_order,
      });
      itemsByDay.set(item.day_id, list);
    }

    const days: TripDay[] = daysResult.rows.map((day) => ({
      id: day.id,
      label: day.label,
      sortOrder: day.sort_order,
      items: itemsByDay.get(day.id) ?? [],
    }));

    return {
      id: trip.id,
      ownerId: createUserId(trip.owner_id),
      title: trip.title,
      days,
      createdAt: trip.created_at.toISOString(),
      updatedAt: trip.updated_at.toISOString(),
    };
  }

  private async persistTrip(trip: Trip): Promise<Trip> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(
        `
        INSERT INTO trips (id, owner_id, title, status, created_at, updated_at)
        VALUES ($1,$2,$3,'active',$4::timestamptz,$5::timestamptz)
        ON CONFLICT (id) DO UPDATE SET
          title = EXCLUDED.title,
          updated_at = EXCLUDED.updated_at
        `,
        [trip.id, trip.ownerId.value, trip.title, trip.createdAt, trip.updatedAt],
      );

      await client.query(`DELETE FROM trip_days WHERE trip_id = $1`, [trip.id]);
      for (const day of trip.days) {
        await client.query(
          `INSERT INTO trip_days (id, trip_id, label, sort_order) VALUES ($1,$2,$3,$4)`,
          [day.id, trip.id, day.label, day.sortOrder],
        );
        for (const item of day.items) {
          await client.query(
            `
            INSERT INTO itinerary_items (id, day_id, kind, title, notes, ref_slug, sort_order)
            VALUES ($1,$2,$3,$4,$5,$6,$7)
            `,
            [item.id, day.id, item.kind, item.title, item.notes, item.refSlug, item.sortOrder],
          );
        }
      }

      // Ensure owner traveller row exists
      await client.query(
        `
        INSERT INTO trip_travellers (id, trip_id, user_id, display_name, role)
        VALUES ($1,$2,$3,'Owner','owner')
        ON CONFLICT (trip_id, user_id) DO NOTHING
        `,
        [crypto.randomUUID(), trip.id, trip.ownerId.value],
      );

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    return (await this.loadTrip(trip.id)) ?? trip;
  }

  async listForUser(userId: string): Promise<Trip[]> {
    const result = await this.pool.query<{ id: string }>(
      `SELECT id FROM trips WHERE owner_id = $1 ORDER BY updated_at DESC`,
      [userId],
    );
    const trips: Trip[] = [];
    for (const row of result.rows) {
      const trip = await this.loadTrip(row.id);
      if (trip) trips.push(trip);
    }
    return trips;
  }

  async getForUser(tripId: string, userId: string): Promise<Trip> {
    const trip = await this.loadTrip(tripId);
    if (!trip) throw new TripNotFoundError(tripId);
    assertTripOwner(trip, userId);
    return trip;
  }

  async create(userId: string, title: string): Promise<Trip> {
    const trip = createTrip({ ownerId: userId, title });
    return this.persistTrip(trip);
  }

  async rename(tripId: string, userId: string, title: string): Promise<Trip> {
    const current = await this.getForUser(tripId, userId);
    return this.persistTrip(renameTrip(current, title));
  }

  async delete(tripId: string, userId: string): Promise<void> {
    await this.getForUser(tripId, userId);
    await this.pool.query(`DELETE FROM trips WHERE id = $1 AND owner_id = $2`, [tripId, userId]);
  }

  async addItem(
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
    const current = await this.getForUser(tripId, userId);
    return this.persistTrip(addItineraryItem(current, input.dayId, input));
  }

  async reorderItems(
    tripId: string,
    userId: string,
    dayId: string,
    orderedItemIds: readonly string[],
  ): Promise<Trip> {
    const current = await this.getForUser(tripId, userId);
    return this.persistTrip(reorderItineraryItems(current, dayId, orderedItemIds));
  }

  async deleteItem(tripId: string, userId: string, dayId: string, itemId: string): Promise<Trip> {
    const current = await this.getForUser(tripId, userId);
    return this.persistTrip(deleteItineraryItem(current, dayId, itemId));
  }
}
