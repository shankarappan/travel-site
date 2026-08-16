import { getDefaultAccommodationProvider } from '@travel/providers';
import { parseStaySearch } from '@travel/api-contracts';
import { NextResponse } from 'next/server';

const provider = getDefaultAccommodationProvider();

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = parseStaySearch({
    destination: url.searchParams.get('destination') ?? '',
    checkIn: url.searchParams.get('checkIn') ?? '',
    checkOut: url.searchParams.get('checkOut') ?? '',
    adults: Number(url.searchParams.get('adults') ?? '2'),
    children: Number(url.searchParams.get('children') ?? '0'),
    currency: url.searchParams.get('currency') ?? 'NZD',
  });

  try {
    const offers = await provider.search(parsed);
    return NextResponse.json({
      provider: provider.name,
      partialError: null,
      offers,
    });
  } catch (error) {
    return NextResponse.json(
      {
        provider: provider.name,
        partialError: error instanceof Error ? error.message : 'Search failed',
        offers: [],
      },
      { status: 502 },
    );
  }
}
