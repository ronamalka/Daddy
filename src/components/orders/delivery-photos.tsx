"use client";

/** Private before/after photos from the daddy's mark-delivered step. */
export function DeliveryPhotos({ photos, note }: { photos: string[]; note?: string | null }) {
  if (photos.length === 0) return null;

  return (
    <div className="mb-5 rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-bg))] p-4">
      <p className="mb-2 text-[14px] font-bold text-[rgb(var(--color-text))]">תמונות מהביקור</p>
      {note ? (
        <p className="mb-3 text-[13px] leading-relaxed text-[rgb(var(--color-text-secondary))]">{note}</p>
      ) : null}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {photos.map((url, index) => (
          <a
            key={url}
            href={url}
            target="_blank"
            rel="noreferrer"
            className="block overflow-hidden rounded-lg border border-[rgb(var(--color-border))]"
          >
            <img src={url} alt={`תמונת המסירה ${index + 1}`} className="h-28 w-full object-cover" />
          </a>
        ))}
      </div>
    </div>
  );
}
