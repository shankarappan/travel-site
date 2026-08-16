import type { MoneyDto, StaySearch } from '@travel/api-contracts';

export interface NormalizedStayOffer {
  offerId: string;
  provider: string;
  propertyName: string;
  destination: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  adults: number;
  children: number;
  roomName: string;
  total: MoneyDto;
  taxesAndFees: MoneyDto;
  cancellationSummary: string;
  expiresAt: string;
}

export interface QuoteSnapshot {
  quoteId: string;
  offerId: string;
  total: MoneyDto;
  taxesAndFees: MoneyDto;
  cancellationTerms: string;
  expiresAt: string;
  currency: string;
}

export interface BookingRequest {
  quoteId: string;
  guestName: string;
  guestEmail: string;
}

export interface ProviderBookingResult {
  providerBookingId: string;
  status: 'pending' | 'confirmed' | 'failed';
}

export interface ProviderBookingState {
  providerBookingId: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'failed';
}

export interface CancelRequest {
  providerBookingId: string;
  reason?: string;
}

export interface CancelResult {
  providerBookingId: string;
  status: 'cancelled' | 'pending' | 'failed';
}

export interface AccommodationProvider {
  readonly name: string;
  search(input: StaySearch): Promise<NormalizedStayOffer[]>;
  reprice(offerRef: string): Promise<QuoteSnapshot>;
  book(input: BookingRequest, idempotencyKey: string): Promise<ProviderBookingResult>;
  retrieve(providerBookingId: string): Promise<ProviderBookingState>;
  cancel(input: CancelRequest): Promise<CancelResult>;
}

function nightsBetween(checkIn: string, checkOut: string): number {
  const start = Date.parse(checkIn);
  const end = Date.parse(checkOut);
  return Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)));
}

const FIXTURE_PROPERTIES = [
  {
    id: 'lakeview-lodge',
    propertyName: 'Lakeview Lodge',
    destinationKeys: ['queenstown', 'wakatipu'],
    roomName: 'Lake King Room',
    baseMinor: 28900,
    cancellationSummary: 'Free cancellation until 48 hours before check-in',
  },
  {
    id: 'fern-retreat',
    propertyName: 'Fern Retreat',
    destinationKeys: ['rotorua'],
    roomName: 'Garden Studio',
    baseMinor: 21900,
    cancellationSummary: 'Non-refundable rate',
  },
  {
    id: 'harbour-house',
    propertyName: 'Harbour House',
    destinationKeys: ['wellington'],
    roomName: 'City Twin',
    baseMinor: 24900,
    cancellationSummary: 'Free cancellation until 24 hours before check-in',
  },
  {
    id: 'fiord-cabin',
    propertyName: 'Fiord Cabin',
    destinationKeys: ['fiordland', 'te anau', 'milford'],
    roomName: 'Rainforest Cabin',
    baseMinor: 25900,
    cancellationSummary: 'Free cancellation until 72 hours before check-in',
  },
] as const;

/** Deterministic sandbox provider for contract tests and UX development. */
export class FakeSandboxAccommodationProvider implements AccommodationProvider {
  readonly name = 'fake-sandbox';
  private readonly quotes = new Map<string, QuoteSnapshot>();
  private readonly bookings = new Map<string, ProviderBookingState>();
  private readonly idempotency = new Map<string, ProviderBookingResult>();

  async search(input: StaySearch): Promise<NormalizedStayOffer[]> {
    const nights = nightsBetween(input.checkIn, input.checkOut);
    const needle = input.destination.trim().toLowerCase();
    const matches = FIXTURE_PROPERTIES.filter((property) =>
      property.destinationKeys.some((key) => needle.includes(key) || key.includes(needle)),
    );

    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    return matches.map((property) => {
      const totalMinor = property.baseMinor * nights * Math.max(1, input.adults);
      const taxes = Math.round(totalMinor * 0.15);
      return {
        offerId: `${property.id}:${input.checkIn}:${input.checkOut}:${input.adults}:${input.children}`,
        provider: this.name,
        propertyName: property.propertyName,
        destination: input.destination,
        checkIn: input.checkIn,
        checkOut: input.checkOut,
        nights,
        adults: input.adults,
        children: input.children,
        roomName: property.roomName,
        total: { amountMinor: totalMinor + taxes, currency: input.currency },
        taxesAndFees: { amountMinor: taxes, currency: input.currency },
        cancellationSummary: property.cancellationSummary,
        expiresAt,
      };
    });
  }

  async reprice(offerRef: string): Promise<QuoteSnapshot> {
    const [propertyId, checkIn, checkOut, adults, children] = offerRef.split(':');
    const property = FIXTURE_PROPERTIES.find((item) => item.id === propertyId);
    if (!property || !checkIn || !checkOut || !adults) {
      throw new Error('Unknown offer reference');
    }
    const nights = nightsBetween(checkIn, checkOut);
    const adultCount = Number(adults);
    const totalMinor = property.baseMinor * nights * Math.max(1, adultCount);
    const taxes = Math.round(totalMinor * 0.15);
    const quote: QuoteSnapshot = {
      quoteId: `quote_${offerRef}`,
      offerId: offerRef,
      total: { amountMinor: totalMinor + taxes, currency: 'NZD' },
      taxesAndFees: { amountMinor: taxes, currency: 'NZD' },
      cancellationTerms: property.cancellationSummary,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      currency: 'NZD',
    };
    this.quotes.set(quote.quoteId, quote);
    void children;
    return quote;
  }

  async book(input: BookingRequest, idempotencyKey: string): Promise<ProviderBookingResult> {
    const existing = this.idempotency.get(idempotencyKey);
    if (existing) return existing;

    const quote = this.quotes.get(input.quoteId);
    if (!quote) {
      throw new Error('Quote not found or expired');
    }
    if (Date.parse(quote.expiresAt) < Date.now()) {
      throw new Error('Quote expired');
    }

    const providerBookingId = `bk_${idempotencyKey}`;
    const result: ProviderBookingResult = { providerBookingId, status: 'confirmed' };
    this.idempotency.set(idempotencyKey, result);
    this.bookings.set(providerBookingId, {
      providerBookingId,
      status: 'confirmed',
    });
    return result;
  }

  async retrieve(providerBookingId: string): Promise<ProviderBookingState> {
    const booking = this.bookings.get(providerBookingId);
    if (!booking) {
      throw new Error('Booking not found');
    }
    return booking;
  }

  async cancel(input: CancelRequest): Promise<CancelResult> {
    const booking = this.bookings.get(input.providerBookingId);
    if (!booking) {
      return { providerBookingId: input.providerBookingId, status: 'failed' };
    }
    const next = { ...booking, status: 'cancelled' as const };
    this.bookings.set(input.providerBookingId, next);
    return { providerBookingId: input.providerBookingId, status: 'cancelled' };
  }
}

export class UnconfiguredAccommodationProvider implements AccommodationProvider {
  readonly name = 'unconfigured';

  async search(_input: StaySearch): Promise<NormalizedStayOffer[]> {
    return [];
  }

  async reprice(_offerRef: string): Promise<QuoteSnapshot> {
    throw new Error('Accommodation provider is not configured');
  }

  async book(_input: BookingRequest, _idempotencyKey: string): Promise<ProviderBookingResult> {
    throw new Error('Accommodation provider is not configured');
  }

  async retrieve(_providerBookingId: string): Promise<ProviderBookingState> {
    throw new Error('Accommodation provider is not configured');
  }

  async cancel(_input: CancelRequest): Promise<CancelResult> {
    throw new Error('Accommodation provider is not configured');
  }
}

export function getDefaultAccommodationProvider(): AccommodationProvider {
  return new FakeSandboxAccommodationProvider();
}

export type { FlightOffer, FlightProvider, FlightSearch } from './flights.js';
export { UnconfiguredFlightProvider } from './flights.js';
