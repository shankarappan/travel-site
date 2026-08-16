import type { MoneyDto } from '@travel/api-contracts';

export interface FlightSearch {
  origin: string;
  destination: string;
  departDate: string;
  returnDate?: string;
  adults: number;
  cabin: 'economy' | 'premium_economy' | 'business';
}

export interface FlightOffer {
  offerId: string;
  provider: string;
  total: MoneyDto;
  segments: Array<{
    from: string;
    to: string;
    departAt: string;
    arriveAt: string;
    flightNumber: string;
  }>;
  baggageSummary: string;
  fareRulesSummary: string;
  expiresAt: string;
}

export interface FlightProvider {
  readonly name: string;
  search(input: FlightSearch): Promise<FlightOffer[]>;
}

/** Stub only — commercial GDS/access must be verified before live use (Prompt 24). */
export class UnconfiguredFlightProvider implements FlightProvider {
  readonly name = 'unconfigured-flight';
  async search(_input: FlightSearch): Promise<FlightOffer[]> {
    return [];
  }
}
