"use client";

import { FileText } from "@phosphor-icons/react";
import { isAllowedAttachmentUrl, isImageAttachment } from "@/lib/attachment-url";
import { cn } from "@/lib/utils";

/** Renders a chat attachment only if it is a same-origin upload path. */
export function AttachmentBubble({ url, onPrimary }: { url: string; onPrimary?: boolean }) {
  if (!isAllowedAttachmentUrl(url)) return null;

  if (isImageAttachment(url)) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="mb-2 block">
        <img src={url} alt="תמונה מצורפת" className="max-h-48 max-w-full rounded-lg" />
      </a>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "mb-2 inline-flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] font-medium",
        onPrimary ? "bg-white/20 text-white" : "bg-[rgba(var(--color-primary),0.1)] text-[rgb(var(--color-primary))]"
      )}
    >
      <FileText className="h-4 w-4" />
      קובץ PDF
    </a>
  );
}
