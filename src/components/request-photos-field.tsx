"use client";

import { Image as ImageIcon, X } from "@phosphor-icons/react";
import { MAX_REQUEST_PHOTOS } from "@/lib/request-details";

interface RequestPhotosFieldProps {
  photos: string[];
  onChange: (photos: string[]) => void;
  error?: string;
  onError: (message: string) => void;
  onUploading?: (uploading: boolean) => void;
  max?: number;
  label?: string;
  hint?: string;
  altPrefix?: string;
}

/** Uploads photos through `/api/upload` (request quoting by default, or a custom cap/label). */
export function RequestPhotosField({
  photos,
  onChange,
  error,
  onError,
  onUploading,
  max = MAX_REQUEST_PHOTOS,
  label,
  hint = "תמונה של הבעיה עוזרת לאבאל׳ות לתת הצעה מדויקת. לא מופיעה בעמוד הציבורי.",
  altPrefix = "תמונת הבקשה",
}: RequestPhotosFieldProps) {
  /** Uploads selected images and appends their URLs, up to the photo cap. */
  async function onFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const remaining = max - photos.length;
    if (remaining <= 0) return;
    const batch = Array.from(files).slice(0, remaining);
    onError("");
    onUploading?.(true);
    try {
      const form = new FormData();
      for (const file of batch) form.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) {
        onError(data.error || "העלאת התמונות נכשלה");
        return;
      }
      const urls = (data.files as { url: string }[]).map((f) => f.url);
      onChange([...photos, ...urls].slice(0, max));
    } catch {
      onError("העלאת התמונות נכשלה");
    } finally {
      onUploading?.(false);
    }
  }

  return (
    <div>
      <label className="mb-2 block text-[13px] font-semibold text-[rgb(var(--color-text-secondary))]">
        {label ?? `תמונות (עד ${max})`}
      </label>
      <p className="mb-2 text-[12px] text-[rgb(var(--color-text-muted))]">{hint}</p>
      <div className="flex flex-wrap gap-2">
        {photos.map((url, index) => (
          <div key={url} className="relative h-20 w-20 overflow-hidden rounded-lg border border-[rgb(var(--color-border))]">
            <img src={url} alt={`${altPrefix} ${index + 1}`} className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => onChange(photos.filter((photo) => photo !== url))}
              className="absolute top-0.5 start-0.5 rounded-full bg-black/60 p-0.5 text-white"
              aria-label="הסר תמונה"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        {photos.length < max && (
          <label className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-[rgb(var(--color-border))] text-[rgb(var(--color-text-muted))] hover:bg-[rgb(var(--color-bg))]">
            <ImageIcon className="h-5 w-5" />
            <span className="mt-1 text-[10px]">הוסף</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="hidden"
              onChange={(e) => {
                onFiles(e.target.files);
                e.target.value = "";
              }}
            />
          </label>
        )}
      </div>
      {error ? <p className="mt-2 text-[13px] text-[rgb(var(--color-error))]">{error}</p> : null}
    </div>
  );
}
