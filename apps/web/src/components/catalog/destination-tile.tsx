import Image from 'next/image';
import Link from 'next/link';

export function DestinationTile({
  href,
  name,
  region,
  summary,
  imageSrc,
  imageAlt,
}: {
  href: string;
  name: string;
  region: string;
  summary: string;
  imageSrc: string;
  imageAlt: string;
}) {
  return (
    <Link href={href} className="group block no-underline">
      <article className="overflow-hidden rounded-[var(--travel-radius-lg)] bg-[var(--travel-color-surface-elevated)] shadow-[var(--travel-elevation-1)] transition-[transform,box-shadow] duration-[var(--travel-motion-base)] hover:-translate-y-0.5 hover:shadow-[var(--travel-elevation-2)]">
        <div className="relative aspect-[4/3] overflow-hidden">
          <Image
            src={imageSrc}
            alt={imageAlt}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover transition-transform duration-[var(--travel-motion-slow)] group-hover:scale-[1.04]"
          />
        </div>
        <div className="space-y-1.5 p-4 sm:p-5">
          <p className="travel-caption">{region}</p>
          <h3 className="travel-h3 text-[var(--travel-color-ink)]">{name}</h3>
          <p className="line-clamp-2 text-sm text-[var(--travel-color-ink-soft)]">{summary}</p>
        </div>
      </article>
    </Link>
  );
}
