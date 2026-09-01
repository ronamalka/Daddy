"use client";

import { useState } from "react";
import { Camera } from "@phosphor-icons/react";
import { Dialog } from "@/components/ui/dialog";
import { RequestPhotosField } from "@/components/request-photos-field";
import { MAX_DELIVERY_NOTE, MAX_DELIVERY_PHOTOS, MIN_DELIVERY_PHOTOS } from "@/lib/delivery-photos";

interface DeliverDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  onDelivered: (order: { status: string; deliveryPhotos?: string[]; deliveryNote?: string | null }) => void;
}

/** Seller form to mark a job delivered with 1–6 photos and an optional note. */
export function DeliverDialog({ open, onOpenChange, orderId, onDelivered }: DeliverDialogProps) {
  const [photos, setPhotos] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [photoError, setPhotoError] = useState("");

  /** Clears the form when the dialog closes. */
  function reset() {
    setPhotos([]);
    setNote("");
    setError("");
    setPhotoError("");
    setUploading(false);
    setSubmitting(false);
  }

  /** Sends the delivery photos and optional note, then marks the order delivered. */
  async function submit() {
    if (photos.length < MIN_DELIVERY_PHOTOS || uploading) return;
    setSubmitting(true);
    setError("");
    const trimmed = note.trim();
    const res = await fetch(`/api/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: "DELIVERED",
        photos,
        ...(trimmed ? { note: trimmed } : {}),
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError((data as { error?: string }).error || "לא הצלחנו לסמן כנמסר");
      setSubmitting(false);
      return;
    }
    onDelivered(data);
    reset();
    onOpenChange(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
      className="max-w-lg"
      labelledBy="deliver-dialog-title"
    >
      <div className="pt-2">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[rgba(var(--color-primary),0.1)]">
            <Camera className="h-5 w-5 text-[rgb(var(--color-primary))]" weight="fill" />
          </div>
          <div>
            <h3 id="deliver-dialog-title" className="text-[16px] font-bold text-[rgb(var(--color-text))]">
              סימון כנמסר
            </h3>
            <p className="text-[13px] text-[rgb(var(--color-text-secondary))]">
              צרפו תמונות של העבודה שהושלמה. הלקוח יראה אותן לפני אישור.
            </p>
          </div>
        </div>

        <RequestPhotosField
          photos={photos}
          onChange={setPhotos}
          error={photoError}
          onError={setPhotoError}
          onUploading={setUploading}
          max={MAX_DELIVERY_PHOTOS}
          label={`תמונות (${MIN_DELIVERY_PHOTOS}–${MAX_DELIVERY_PHOTOS})`}
          hint="לפני ואחרי, או תמונה של העבודה הגמורה. לא מופיע בגלריה ציבורית."
          altPrefix="תמונת המסירה"
        />

        <label className="mb-1.5 mt-4 block text-[13px] font-semibold text-[rgb(var(--color-text))]">
          הערה (אופציונלי)
        </label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          maxLength={MAX_DELIVERY_NOTE}
          placeholder="לדוגמה: החלפתי את הברז, הישן בשקית"
          className="mb-4 w-full rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface-elevated))] px-4 py-3 text-[14px] text-[rgb(var(--color-text))] placeholder-[rgb(var(--color-text-muted))] focus:border-[rgb(var(--color-primary))] focus:outline-none focus:ring-2 focus:ring-[rgba(var(--color-primary),0.2)] resize-none"
        />

        {uploading && <p className="mb-3 text-[12px] text-[rgb(var(--color-text-muted))]">מעלה תמונות...</p>}
        {error && <p role="alert" className="mb-3 text-[13px] text-[rgb(var(--color-error))]">{error}</p>}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={submit}
            disabled={submitting || uploading || photos.length < MIN_DELIVERY_PHOTOS}
            className="flex-1 rounded-xl bg-[rgb(var(--color-primary))] px-5 py-2.5 text-[14px] font-semibold text-white transition-all hover:bg-[rgb(var(--color-primary-hover))] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting ? "שולח..." : "שלח מסירה"}
          </button>
          <button
            type="button"
            onClick={() => {
              reset();
              onOpenChange(false);
            }}
            className="rounded-xl border border-[rgb(var(--color-border))] px-5 py-2.5 text-[14px] font-medium text-[rgb(var(--color-text-secondary))] transition-colors hover:bg-[rgb(var(--color-surface-elevated))]"
          >
            ביטול
          </button>
        </div>
      </div>
    </Dialog>
  );
}
