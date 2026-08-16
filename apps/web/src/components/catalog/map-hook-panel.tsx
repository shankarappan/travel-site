import type { MapHook } from '@travel/api-contracts';

/**
 * Map hook placeholder — lazy map SDKs should mount here later without blocking SSR content.
 */
export function MapHookPanel({ map }: { map: MapHook }) {
  return (
    <section
      aria-label={`Map placeholder for ${map.label}`}
      className="border border-dashed border-[var(--travel-color-border)] bg-[var(--travel-color-glacier-soft)]/40 px-4 py-5"
    >
      <h2 className="font-[family-name:var(--travel-font-display)] text-xl font-semibold text-[var(--travel-color-ink)]">
        Map
      </h2>
      <p className="mt-2 text-sm text-[var(--travel-color-ink-soft)]">
        {map.label} · {map.latitude.toFixed(4)}, {map.longitude.toFixed(4)} · zoom {map.zoom}
      </p>
      <p className="mt-2 text-sm text-[var(--travel-color-ink-soft)]">
        Interactive maps will lazy-load here so destination content stays fast on mobile.
      </p>
    </section>
  );
}
