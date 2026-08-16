import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { DestinationTemplate } from '../../../components/catalog/destination-template';
import { catalogRepository } from '../../../server/catalog/file-repository';

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const destinations = await catalogRepository.listDestinations();
  return destinations.map((destination) => ({ slug: destination.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const destination = await catalogRepository.getDestination(slug);
  if (!destination) {
    return { title: 'Destination not found' };
  }
  return {
    title: destination.seo.title,
    description: destination.seo.description,
    openGraph: {
      title: destination.seo.title,
      description: destination.seo.description,
      images: [{ url: destination.hero.src, alt: destination.hero.alt }],
    },
  };
}

export default async function DestinationPage({ params }: PageProps) {
  const { slug } = await params;
  const destination = await catalogRepository.getDestination(slug);
  if (!destination) {
    notFound();
  }
  const guides = await catalogRepository.listGuidesForDestination(destination.slug);
  return <DestinationTemplate destination={destination} guides={guides} />;
}
