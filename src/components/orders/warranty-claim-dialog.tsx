"use client";

import { useState } from "react";
import { ShieldCheck, Image as ImageIcon, X } from "@phosphor-icons/react";
import { Dialog } from "@/components/ui/dialog";

const MAX_WARRANTY_PHOTOS = 5;

interface WarrantyClaimDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  onCreated: (claim: {
    id: string;
    status: string;
    description: string;
    photos: string[];
    createdAt: string;
  }) => void;
}

/** Form to open a warranty claim with a description and up to five photos. */
export function WarrantyClaimDialog({ open, onOpenChange, orderId, onCreated }: WarrantyClaimDialogProps) {
  const [description, setDescription] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function reset() {
    setDescription("");
    setPhotos([]);
    setError("");
    setUploading(false);
    setSubmitting(false);
  }

  async function onFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const remaining = MAX_WARRANTY_PHOTOS - photos.length;
    if (remaining <= 0) return;
    const batch = Array.from(files).slice(0, remaining);
    setUploading(true);
    setError("");
    try {
      const form = new FormData();
      for (const file of batch) form.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "העלאת התמונות נכשלה");
        return;
      }
      const urls = (data.files as { url: string }[]).map((f) => f.url);
      setPhotos((prev) => [...prev, ...urls].slice(0, MAX_WARRANTY_PHOTOS));
    } catch {
      setError("העלאת התמונות נכשלה");
    } finally {
      setUploading(false);
    }
  }

  async function submit() {
    if (!description.trim()) return;
    setSubmitting(true);
    setError("");
    const res = await fetch(`/api/orders/${orderId}/warranty`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description: description.trim(), photos }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "שליחת הדיווח נכשלה");
      setSubmitting(false);
      return;
    }
    onCreated(data);
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
      labelledBy="warranty-dialog-title"
    >
      <div className="pt-2">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[rgba(var(--color-warning),0.15)]">
            <ShieldCheck className="h-5 w-5 text-[rgb(var(--color-warning))]" weight="fill" />
          </div>
          <div>
            <h3 id="warranty-dialog-title" className="text-[16px] font-bold text-[rgb(var(--color-text))]">
              דיווח על בעיה — אחריות 30 יום
            </h3>
            <p className="text-[13px] text-[rgb(var(--color-text-secondary))]">
              צוות אבאל׳ה יבדוק ויטפל בבעיה
            </p>
          </div>
        </div>

        <label className="mb-1.5 block text-[13px] font-semibold text-[rgb(var(--color-text))]">
          תאר את הבעיה
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          maxLength={2000}
          placeholder="מה קרה? תארו את הבעיה בפירוט..."
          className="mb-4 w-full rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface-elevated))] px-4 py-3 text-[14px] text-[rgb(var(--color-text))] placeholder-[rgb(var(--color-text-muted))] focus:border-[rgb(var(--color-primary))] focus:outline-none focus:ring-2 focus:ring-[rgba(var(--color-primary),0.2)] resize-none"
        />

        <label className="mb-1.5 block text-[13px] font-semibold text-[rgb(var(--color-text))]">
          תמונות (עד {MAX_WARRANTY_PHOTOS})
        </label>
        <div className="mb-4 flex flex-wrap gap-2">
          {photos.map((url) => (
            <div key={url} className="relative h-16 w-16 overflow-hidden rounded-lg border border-[rgb(var(--color-border))]">
              <img src={url} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => setPhotos((prev) => prev.filter((p) => p !== url))}
                className="absolute top-0.5 start-0.5 rounded-full bg-black/60 p-0.5 text-white"
                aria-label="הסר תמונה"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          {photos.length < MAX_WARRANTY_PHOTOS && (
            <label className="flex h-16 w-16 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-[rgb(var(--color-border))] text-[rgb(var(--color-text-muted))] hover:bg-[rgb(var(--color-surface-elevated))]">
              <ImageIcon className="h-5 w-5" />
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
        {uploading && (
          <p className="mb-3 text-[12px] text-[rgb(var(--color-text-muted))]">מעלה תמונות...</p>
        )}
        {error && (
          <p className="mb-3 text-[13px] text-[rgb(var(--color-error))]">{error}</p>
        )}

        <div className="flex gap-3">
          <button
            onClick={submit}
            disabled={submitting || uploading || !description.trim()}
            className="flex-1 rounded-xl bg-[rgb(var(--color-warning))] px-5 py-2.5 text-[14px] font-semibold text-white transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting ? "שולח..." : "שלח דיווח"}
          </button>
          <button
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
