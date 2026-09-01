"use client";

import { useRef, useState } from "react";
import { FileText, Paperclip, X } from "@phosphor-icons/react";
import { isAllowedAttachmentUrl, isImageAttachment } from "@/lib/attachment-url";

const ACCEPT = "image/jpeg,image/png,image/webp,application/pdf,.jpg,.jpeg,.png,.webp,.pdf";

/** Uploads one chat file through /api/upload and returns the stored path. */
export async function uploadChatAttachment(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch("/api/upload", { method: "POST", body: form });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(typeof data.error === "string" ? data.error : "העלאת הקובץ נכשלה");
  }
  const url = (data.files as { url: string }[] | undefined)?.[0]?.url;
  if (!isAllowedAttachmentUrl(url)) {
    throw new Error("כתובת קובץ לא תקינה");
  }
  return url;
}

interface ComposerAttachProps {
  value: string | null;
  onChange: (url: string | null) => void;
  disabled?: boolean;
  onError?: (message: string) => void;
  onBusyChange?: (busy: boolean) => void;
}

/** Paperclip control that uploads one image or PDF and shows a pending preview. */
export function ComposerAttach({ value, onChange, disabled, onError, onBusyChange }: ComposerAttachProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  /** Uploads the chosen file and stores the returned /uploads path. */
  async function onFile(files: FileList | null) {
    const file = files?.[0];
    if (inputRef.current) inputRef.current.value = "";
    if (!file) return;
    setUploading(true);
    onBusyChange?.(true);
    onError?.("");
    try {
      const url = await uploadChatAttachment(file);
      onChange(url);
    } catch (err) {
      onError?.(err instanceof Error ? err.message : "העלאת הקובץ נכשלה");
    } finally {
      setUploading(false);
      onBusyChange?.(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="sr-only"
        disabled={disabled || uploading}
        onChange={(e) => onFile(e.target.files)}
      />
      <button
        type="button"
        disabled={disabled || uploading}
        onClick={() => inputRef.current?.click()}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[rgb(var(--color-text-secondary))] transition-colors hover:bg-[rgb(var(--color-surface-elevated))] disabled:opacity-40"
        aria-label="צרף תמונה או PDF"
        title="צרף תמונה או PDF"
      >
        <Paperclip className="h-5 w-5" />
      </button>
      {value && (
        <span className="relative inline-flex max-w-[7rem] items-center">
          {isImageAttachment(value) ? (
            <img src={value} alt="" className="h-11 w-11 rounded-lg object-cover" />
          ) : (
            <span className="inline-flex h-11 items-center gap-1 rounded-lg bg-[rgba(var(--color-primary),0.1)] px-2 text-[11px] font-medium text-[rgb(var(--color-primary))]">
              <FileText className="h-4 w-4" />
              PDF
            </span>
          )}
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute -top-1 -start-1 flex h-4 w-4 items-center justify-center rounded-full bg-[rgb(var(--color-text))] text-white"
            aria-label="הסר קובץ"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      )}
      {uploading && (
        <span className="text-[12px] text-[rgb(var(--color-text-muted))]">מעלה...</span>
      )}
    </div>
  );
}
