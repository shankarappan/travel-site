import type { ContentImage } from '@travel/api-contracts';
import Image from 'next/image';

export function ContentHero({
  image,
  priority = false,
}: {
  image: ContentImage;
  priority?: boolean;
}) {
  return (
    <figure className="relative isolate min-h-[18rem] overflow-hidden sm:min-h-[24rem]">
      <Image
        src={image.src}
        alt={image.alt}
        fill
        priority={priority}
        sizes="100vw"
        className="object-cover"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-[linear-gradient(180deg,rgb(11_46_38_/0.15),rgb(11_46_38_/0.55))]"
      />
      <figcaption className="absolute bottom-3 right-3 rounded-[var(--travel-radius-sm)] bg-black/45 px-2 py-1 text-xs text-white">
        Photo: {image.sourceUrl ? <a href={image.sourceUrl}>{image.source}</a> : image.source}
      </figcaption>
    </figure>
  );
}
