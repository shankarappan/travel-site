import type { DestinationContent, GuideContent } from '@travel/api-contracts';

export interface CatalogRepository {
  listDestinations(): Promise<DestinationContent[]>;
  getDestination(slug: string): Promise<DestinationContent | null>;
  listGuides(): Promise<GuideContent[]>;
  getGuide(slug: string): Promise<GuideContent | null>;
  listGuidesForDestination(destinationSlug: string): Promise<GuideContent[]>;
}
