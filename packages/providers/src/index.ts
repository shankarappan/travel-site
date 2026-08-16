import type { MoneyDto, StaySearch } from '@travel/api-contracts';

export interface NormalizedStayOffer {
  offerId: string;
  provider: string;
  propertyName: string;
  destination: string;
  checkIn: string;
  checkOut: string;
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

/** Placeholder adapter — real supplier adapters come after access is verified. */
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
