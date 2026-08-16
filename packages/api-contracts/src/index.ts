import { z } from 'zod';

export const moneySchema = z.object({
  amountMinor: z.number().int().nonnegative(),
  currency: z.string().length(3).toUpperCase(),
});

export const staySearchSchema = z.object({
  destination: z.string().min(1).max(120),
  checkIn: z.string().date(),
  checkOut: z.string().date(),
  adults: z.number().int().min(1).max(16),
  children: z.number().int().min(0).max(16).default(0),
  currency: z.string().length(3).toUpperCase().default('NZD'),
});

export const destinationSlugSchema = z
  .string()
  .min(2)
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

export const contentImageSchema = z.object({
  src: z.string().url(),
  alt: z.string().min(8).max(200),
  source: z.string().min(2).max(200),
  sourceUrl: z.string().url().optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
});

export const mapHookSchema = z.object({
  label: z.string().min(2).max(120),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  zoom: z.number().int().min(1).max(18).default(10),
});

export const seoMetadataSchema = z.object({
  title: z.string().min(8).max(70),
  description: z.string().min(20).max(180),
  ogImage: contentImageSchema.optional(),
});

export const destinationContentSchema = z.object({
  slug: destinationSlugSchema,
  name: z.string().min(2).max(120),
  region: z.string().min(2).max(120),
  summary: z.string().min(20).max(400),
  hero: contentImageSchema,
  highlights: z.array(z.string().min(4).max(160)).min(2).max(8),
  body: z.array(z.string().min(20)).min(1),
  accommodationPlaceholder: z.string().min(10).max(300),
  activitiesPlaceholder: z.string().min(10).max(300),
  map: mapHookSchema,
  seo: seoMetadataSchema,
  relatedGuideSlugs: z.array(destinationSlugSchema).default([]),
  updatedAt: z.string().datetime(),
});

export const guideContentSchema = z.object({
  slug: destinationSlugSchema,
  title: z.string().min(8).max(160),
  dek: z.string().min(20).max(280),
  destinationSlug: destinationSlugSchema,
  hero: contentImageSchema,
  body: z.array(z.string().min(20)).min(1),
  seo: seoMetadataSchema,
  updatedAt: z.string().datetime(),
});

export type StaySearch = z.infer<typeof staySearchSchema>;
export type MoneyDto = z.infer<typeof moneySchema>;
export type ContentImage = z.infer<typeof contentImageSchema>;
export type MapHook = z.infer<typeof mapHookSchema>;
export type DestinationContent = z.infer<typeof destinationContentSchema>;
export type GuideContent = z.infer<typeof guideContentSchema>;

export function parseStaySearch(input: unknown): StaySearch {
  return staySearchSchema.parse(input);
}

export function parseDestinationContent(input: unknown): DestinationContent {
  return destinationContentSchema.parse(input);
}

export function parseGuideContent(input: unknown): GuideContent {
  return guideContentSchema.parse(input);
}

export function parseDestinationSlug(input: unknown): string {
  return destinationSlugSchema.parse(input);
}
