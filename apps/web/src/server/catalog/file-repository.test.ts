import { describe, expect, it } from 'vitest';
import { FileCatalogRepository } from './file-repository';

describe('FileCatalogRepository', () => {
  const repo = new FileCatalogRepository();

  it('loads NZ destinations from CMS JSON', async () => {
    const destinations = await repo.listDestinations();
    expect(destinations.length).toBeGreaterThanOrEqual(4);
    expect(destinations.every((item) => item.hero.alt.length >= 8)).toBe(true);
    expect(destinations.every((item) => item.seo.title.length >= 8)).toBe(true);
  });

  it('resolves destination and related guides', async () => {
    const queenstown = await repo.getDestination('queenstown');
    expect(queenstown?.region).toBe('Otago');
    const guides = await repo.listGuidesForDestination('queenstown');
    expect(guides.some((guide) => guide.slug === 'queenstown-first-timer')).toBe(true);
  });

  it('returns null for unknown slugs', async () => {
    await expect(repo.getDestination('not-a-place')).resolves.toBeNull();
    await expect(repo.getGuide('missing-guide')).resolves.toBeNull();
  });
});
