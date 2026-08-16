import { describe, expect, it } from 'vitest';
import {
  parseDestinationContent,
  parseDestinationSlug,
  parseGuideContent,
  parseStaySearch,
} from './index.js';

describe('parseStaySearch', () => {
  it('parses a valid NZ stay search', () => {
    const result = parseStaySearch({
      destination: 'Queenstown',
      checkIn: '2026-12-01',
      checkOut: '2026-12-05',
      adults: 2,
    });
    expect(result.currency).toBe('NZD');
    expect(result.children).toBe(0);
  });

  it('rejects empty destinations', () => {
    expect(() =>
      parseStaySearch({
        destination: '',
        checkIn: '2026-12-01',
        checkOut: '2026-12-05',
        adults: 2,
      }),
    ).toThrow();
  });
});

describe('catalog content schemas', () => {
  const hero = {
    src: 'https://images.unsplash.com/photo-1469521669194-babb45599def?auto=format&fit=crop&w=1600&q=80',
    alt: 'Mist over green New Zealand mountains beside a still lake',
    source: 'Unsplash',
    sourceUrl: 'https://unsplash.com',
  };

  it('accepts a destination document', () => {
    const destination = parseDestinationContent({
      slug: 'queenstown',
      name: 'Queenstown',
      region: 'Otago',
      summary: 'Alpine adventure hub on the shores of Lake Wakatipu.',
      hero,
      highlights: ['Lake Wakatipu views', 'Trail access to Remarkables'],
      body: ['Queenstown anchors South Island road trips with hiking, lake days and ski seasons.'],
      accommodationPlaceholder: 'Stay search will connect to sandbox providers soon.',
      activitiesPlaceholder: 'Curated activities will appear once catalog enrichment lands.',
      map: { label: 'Queenstown centre', latitude: -45.0312, longitude: 168.6626, zoom: 11 },
      seo: {
        title: 'Queenstown travel guide',
        description: 'Plan Queenstown with curated highlights, maps and upcoming stay search.',
      },
      relatedGuideSlugs: ['queenstown-first-timer'],
      updatedAt: '2026-08-16T00:00:00.000Z',
    });
    expect(destination.slug).toBe('queenstown');
  });

  it('rejects weak image alt text', () => {
    expect(() =>
      parseDestinationContent({
        slug: 'rotorua',
        name: 'Rotorua',
        region: 'Bay of Plenty',
        summary:
          'Geothermal landscapes and Māori cultural experiences in the central North Island.',
        hero: { ...hero, alt: 'short' },
        highlights: ['Geothermal parks', 'Lake Rotorua'],
        body: ['Rotorua is known for geothermal activity and rich cultural heritage.'],
        accommodationPlaceholder: 'Placeholder stays.',
        activitiesPlaceholder: 'Placeholder activities.',
        map: { label: 'Rotorua', latitude: -38.1368, longitude: 176.2497, zoom: 11 },
        seo: {
          title: 'Rotorua travel guide',
          description: 'Discover Rotorua geothermal parks, lakes and cultural experiences.',
        },
        updatedAt: '2026-08-16T00:00:00.000Z',
      }),
    ).toThrow();
  });

  it('parses guide content and destination slugs', () => {
    expect(parseDestinationSlug('fiordland-national-park')).toBe('fiordland-national-park');
    expect(() => parseDestinationSlug('Bad Slug')).toThrow();
    const guide = parseGuideContent({
      slug: 'queenstown-first-timer',
      title: 'Queenstown for first-timers',
      dek: 'A calm two-day outline before the adventure operators open their calendars.',
      destinationSlug: 'queenstown',
      hero,
      body: [
        'Start on the lake edge at dawn, then walk a short trail before the town centre fills.',
      ],
      seo: {
        title: 'Queenstown first-timer guide',
        description: 'A practical first visit outline for Queenstown without invented prices.',
      },
      updatedAt: '2026-08-16T00:00:00.000Z',
    });
    expect(guide.destinationSlug).toBe('queenstown');
  });
});
