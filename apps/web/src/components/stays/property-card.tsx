import Image from 'next/image';
import Link from 'next/link';

export function PropertyCard({
  href,
  name,
  location,
  blurb,
  imageSrc,
  imageAlt,
  priceLabel,
  meta,
}: {
  href: string;
  name: string;
  location: string;
  blurb: string;
  imageSrc: string;
  imageAlt: string;
  priceLabel?: string;
  meta?: string;
}) {
  return (
    <Link href={href} className="group block h-full no-underline">
      <article className="flex h-full flex-col overflow-hidden rounded-[var(--travel-radius-lg)] bg-[var(--travel-color-surface-elevated)] shadow-[var(--travel-elevation-1)] transition-[transform,box-shadow] duration-[var(--travel-motion-base)] hover:-translate-y-0.5 hover:shadow-[var(--travel-elevation-2)]">
        <div className="relative aspect-[5/4] overflow-hidden">
          <Image
            src={imageSrc}
            alt={imageAlt}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-[var(--travel-motion-slow)] group-hover:scale-[1.04]"
          />
        </div>
        <div className="flex flex-1 flex-col gap-2 p-4 sm:p-5">
          <p className="travel-caption">{location}</p>
          <h3 className="travel-h3 text-[var(--travel-color-ink)]">{name}</h3>
          <p className="line-clamp-2 flex-1 text-sm text-[var(--travel-color-ink-soft)]">{blurb}</p>
          <div className="mt-2 flex items-end justify-between gap-3">
            {priceLabel ? (
              <p className="travel-price text-[var(--travel-color-ink)]">{priceLabel}</p>
            ) : (
              <span />
            )}
            {meta ? <p className="text-xs text-[var(--travel-color-ink-muted)]">{meta}</p> : null}
          </div>
        </div>
      </article>
    </Link>
  );
}
