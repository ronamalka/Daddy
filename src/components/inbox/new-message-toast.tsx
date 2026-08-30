"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ChatCircle } from "@phosphor-icons/react";
import { AnimatePresence, motion } from "framer-motion";
import type { Conversation } from "@/components/inbox/messenger";

/** Popup toast when a new chat arrives and the inbox for that person is not open. */
export function NewMessageToast() {
  const pathname = usePathname();
  const router = useRouter();
  const [toast, setToast] = useState<{ name: string; preview: string; href: string } | null>(null);
  const prevUnread = useRef<Record<string, number>>({});
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const primed = useRef(false);

  useEffect(() => {
    /** Shows the toast and hides it after a few seconds. */
    function show(next: { name: string; preview: string; href: string }) {
      setToast(next);
      if (hideTimer.current) clearTimeout(hideTimer.current);
      hideTimer.current = setTimeout(() => setToast(null), 6000);
    }

    /** Checks conversations for new unread messages and pops a toast if needed. */
    async function poll() {
      const res = await fetch("/api/messages/conversations");
      if (!res.ok) return;
      const data = await res.json();
      if (!Array.isArray(data)) return;
      if (!primed.current) {
        for (const row of data as Conversation[]) {
          prevUnread.current[row.otherUserId] = row.unreadCount || 0;
        }
        primed.current = true;
        return;
      }
      for (const row of data as Conversation[]) {
        const prev = prevUnread.current[row.otherUserId] ?? 0;
        const unread = row.unreadCount || 0;
        const alreadyOpen = pathname === `/inbox/${row.otherUserId}`;
        if (unread > prev && !alreadyOpen) {
          show({
            name: row.otherUser.name,
            preview: row.lastMessage.content,
            href: `/inbox/${row.otherUserId}`,
          });
        }
        prevUnread.current[row.otherUserId] = unread;
      }
    }

    poll();
    const interval = setInterval(poll, 8000);
    window.addEventListener("daddy:messages-changed", poll);
    return () => {
      clearInterval(interval);
      window.removeEventListener("daddy:messages-changed", poll);
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [pathname]);

  return (
    <AnimatePresence>
      {toast && (
        <motion.button
          type="button"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          onClick={() => {
            router.push(toast.href);
            setToast(null);
          }}
          className="fixed bottom-20 start-4 z-[80] flex max-w-sm items-start gap-3 rounded-2xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] p-3 text-start shadow-[0_8px_32px_rgba(var(--color-primary),0.18)] md:bottom-6"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[rgba(var(--color-primary),0.12)] text-[rgb(var(--color-primary))]">
            <ChatCircle className="h-5 w-5" weight="fill" />
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-bold text-[rgb(var(--color-text))]">הודעה חדשה מ{toast.name}</p>
            <p className="mt-0.5 line-clamp-2 text-[12px] text-[rgb(var(--color-text-secondary))]">{toast.preview}</p>
          </div>
        </motion.button>
      )}
    </AnimatePresence>
  );
}
