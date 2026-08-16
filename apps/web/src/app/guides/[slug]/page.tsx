import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { GuideTemplate } from '../../../components/catalog/guide-template';
import { catalogRepository } from '../../../server/catalog/file-repository';

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const guides = await catalogRepository.listGuides();
  return guides.map((guide) => ({ slug: guide.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const guide = await catalogRepository.getGuide(slug);
  if (!guide) {
    return { title: 'Guide not found' };
  }
  return {
    title: guide.seo.title,
    description: guide.seo.description,
    openGraph: {
      title: guide.seo.title,
      description: guide.seo.description,
      images: [{ url: guide.hero.src, alt: guide.hero.alt }],
    },
  };
}

export default async function GuidePage({ params }: PageProps) {
  const { slug } = await params;
  const guide = await catalogRepository.getGuide(slug);
  if (!guide) {
    notFound();
  }
  return <GuideTemplate guide={guide} />;
}
