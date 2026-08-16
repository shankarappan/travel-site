import {
  parseDestinationContent,
  parseGuideContent,
  type DestinationContent,
  type GuideContent,
} from '@travel/api-contracts';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import type { CatalogRepository } from './repository';

function contentRoot(...segments: string[]): string {
  return path.join(process.cwd(), 'content', ...segments);
}

async function readJsonFiles(dir: string): Promise<unknown[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = entries.filter((entry) => entry.isFile() && entry.name.endsWith('.json'));
  const payloads = await Promise.all(
    files.map(async (file) => {
      const raw = await readFile(path.join(dir, file.name), 'utf8');
      return JSON.parse(raw) as unknown;
    }),
  );
  return payloads;
}

export class FileCatalogRepository implements CatalogRepository {
  async listDestinations(): Promise<DestinationContent[]> {
    const payloads = await readJsonFiles(contentRoot('destinations'));
    return payloads
      .map((payload) => parseDestinationContent(payload))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  async getDestination(slug: string): Promise<DestinationContent | null> {
    const destinations = await this.listDestinations();
    return destinations.find((item) => item.slug === slug) ?? null;
  }

  async listGuides(): Promise<GuideContent[]> {
    const payloads = await readJsonFiles(contentRoot('guides'));
    return payloads
      .map((payload) => parseGuideContent(payload))
      .sort((a, b) => a.title.localeCompare(b.title));
  }

  async getGuide(slug: string): Promise<GuideContent | null> {
    const guides = await this.listGuides();
    return guides.find((item) => item.slug === slug) ?? null;
  }

  async listGuidesForDestination(destinationSlug: string): Promise<GuideContent[]> {
    const guides = await this.listGuides();
    return guides.filter((guide) => guide.destinationSlug === destinationSlug);
  }
}

export const catalogRepository: CatalogRepository = new FileCatalogRepository();
