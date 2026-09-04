"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChatCircle, Lock, MagnifyingGlass, PaperPlaneTilt, CaretRight } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { messagePreviewText } from "@/lib/message-validation";
import { AttachmentBubble } from "@/components/chat/attachment-bubble";
import { ComposerAttach } from "@/components/chat/composer-attach";
import { trackEvent } from "@/lib/analytics";

export interface Conversation {
  otherUserId: string;
  unreadCount: number;
  lastMessage: {
    id: string;
    content: string;
    attachment?: string | null;
    senderId: string;
    receiverId: string;
    orderId: string | null;
    createdAt: string;
  };
  otherUser: { id: string; name: string; avatar: string | null };
}

interface ChatMessage {
  id: string;
  content: string;
  attachment: string | null;
  senderId: string;
  receiverId: string;
  orderId: string | null;
  readAt: string | null;
  createdAt: string;
}

/** Turns a date into a short relative label like "5 min" or "yesterday". */
function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "עכשיו";
  if (minutes < 60) return `${minutes} דק׳`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} שע׳`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "אתמול";
  if (days < 7) return `${days} ימים`;
  return new Date(dateStr).toLocaleDateString("he-IL", { day: "numeric", month: "short" });
}

/** Human-readable day heading for a chat timestamp (today, yesterday, or full date). */
function dayLabel(dateStr: string) {
  const date = new Date(dateStr);
  const today = new Date();
  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  if (sameDay(date, today)) return "היום";
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (sameDay(date, yesterday)) return "אתמול";
  return date.toLocaleDateString("he-IL", { weekday: "long", day: "numeric", month: "long" });
}

/** Stable year-month-day key used to group messages by calendar day. */
function dayKey(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

/** Round avatar showing the first letter of a person's name. */
function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" }) {
  const initial = (name || "מ")[0];
  const cls = size === "sm" ? "h-10 w-10 text-[14px]" : "h-12 w-12 text-[16px]";
  return (
    <div
      className={cn(
        cls,
        "flex shrink-0 items-center justify-center rounded-full bg-primary font-bold text-white"
      )}
    >
      {initial}
    </div>
  );
}

/** Fires a browser event so other UI can refresh after messages change. */
export function emitMessagesChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("daddy:messages-changed"));
  }
}

/** Full inbox UI: conversation list on one side and the open thread on the other. */
export function MessengerInbox({ peerId }: { peerId?: string }) {
  const { data: session } = useSession();
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [attachment, setAttachment] = useState<string | null>(null);
  const [attachError, setAttachError] = useState("");
  const [attachBusy, setAttachBusy] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const [newFromId, setNewFromId] = useState<string | null>(null);
  const [orderTitles, setOrderTitles] = useState<Record<string, string>>({});
  const bottomRef = useRef<HTMLDivElement>(null);
  const seededNew = useRef<string | null>(null);

  const me = session?.user?.id;
  const active = conversations.find((c) => c.otherUserId === peerId);
  const peerName = active?.otherUser.name || "שיחה";

  const loadConversations = useCallback(() => {
    return fetch("/api/messages/conversations")
      .then((r) => r.json())
      .then((data) => {
        setConversations(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        setConversations([]);
      });
  }, []);

  useEffect(() => {
    loadConversations().finally(() => setLoading(false));
    const interval = setInterval(loadConversations, 8000);
    /** Reloads conversations when a message event fires. */
    function onChange() {
      loadConversations();
    }
    window.addEventListener("daddy:messages-changed", onChange);
    return () => {
      clearInterval(interval);
      window.removeEventListener("daddy:messages-changed", onChange);
    };
  }, [loadConversations]);

  useEffect(() => {
    fetch("/api/orders")
      .then((r) => r.json())
      .then((data) => {
        if (!Array.isArray(data)) return;
        const map: Record<string, string> = {};
        for (const order of data) {
          map[order.id] = order.gig?.title || order.title || "הזמנה";
        }
        setOrderTitles(map);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!peerId || !me) return;
    const otherId = peerId;
    seededNew.current = null;
    setAttachment(null);
    setAttachError("");
    setDraft("");
    let cancelled = false;

    /** Loads messages with this person and optionally marks them as read. */
    async function loadThread(mark = false) {
      const res = await fetch(`/api/messages?withUser=${encodeURIComponent(otherId)}`);
      const data = await res.json();
      if (cancelled || !Array.isArray(data)) return;
      setMessages(data);
      if (!seededNew.current) {
        const firstUnread = data.find((msg: ChatMessage) => msg.senderId === otherId && !msg.readAt);
        seededNew.current = firstUnread?.id ?? "none";
        setNewFromId(firstUnread?.id ?? null);
      }
      if (mark) {
        await fetch("/api/messages/mark-read", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ senderId: otherId }),
        });
        loadConversations();
      }
    }

    trackEvent("chat_opened", { peerId: otherId });
    loadThread(true);
    const interval = setInterval(() => loadThread(true), 4000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [peerId, me, loadConversations]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length, peerId]);

  const filtered = useMemo(() => {
    const q = query.trim();
    if (!q) return conversations;
    return conversations.filter(
      (c) =>
        c.otherUser.name.includes(q) ||
        messagePreviewText(c.lastMessage.content, c.lastMessage.attachment).includes(q)
    );
  }, [conversations, query]);

  /** Posts the draft message (and optional upload) to the open conversation. */
  async function send(e: React.FormEvent) {
    e.preventDefault();
    if ((!draft.trim() && !attachment) || !peerId || sending || attachBusy) return;
    setSending(true);
    setSendError("");
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiverId: peerId,
          content: draft,
          ...(attachment ? { attachment } : {}),
        }),
      });
      if (res.ok) {
        const created = await res.json();
        setMessages((prev) => [...prev, created]);
        setDraft("");
        setAttachment(null);
        setAttachError("");
        emitMessagesChanged();
        loadConversations();
      } else {
        setSendError("לא הצלחנו לשלוח את ההודעה. נסה שנית.");
      }
    } catch {
      setSendError("שגיאת רשת — ההודעה לא נשלחה.");
    }
    setSending(false);
  }

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="mb-4 rounded-full bg-[rgba(var(--color-primary),0.1)] p-4">
          <Lock className="h-8 w-8 text-[rgb(var(--color-primary))]" />
        </div>
        <p className="text-[16px] text-[rgb(var(--color-text-secondary))]">התחבר כדי לצפות בהודעות.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[rgba(var(--color-primary),0.1)] border-t-[rgb(var(--color-primary))]" />
      </div>
    );
  }

  const list = (
    <div className="flex h-full min-h-0 flex-col border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] md:border-e">
      <div className="border-b border-[rgb(var(--color-border))] px-4 py-4">
        <h1 className="text-[22px] font-bold text-[rgb(var(--color-text))]">הודעות</h1>
        <div className="relative mt-3">
          <MagnifyingGlass className="pointer-events-none absolute top-1/2 start-3 h-4 w-4 -translate-y-1/2 text-[rgb(var(--color-text-muted))]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="חיפוש בשיחות"
            className="w-full rounded-full border border-[rgb(var(--color-border))] bg-[rgb(var(--color-bg))] py-2 ps-9 pe-3 text-[13px] text-[rgb(var(--color-text))] placeholder-[rgb(var(--color-text-muted))] focus:border-[rgb(var(--color-primary))] focus:outline-none"
          />
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <ChatCircle className="mb-3 h-10 w-10 text-[rgb(var(--color-text-muted))]" />
            <p className="text-[15px] font-medium text-[rgb(var(--color-text))]">אין שיחות עדיין</p>
            <p className="mt-1 text-[13px] text-[rgb(var(--color-text-muted))]">כשתשלחו הודעה לאבאל׳ה — השיחה תופיע כאן</p>
          </div>
        ) : (
          filtered.map((c) => {
            const unread = c.unreadCount > 0;
            const selected = c.otherUserId === peerId;
            const mine = c.lastMessage.senderId === me;
            return (
              <Link
                key={c.otherUserId}
                href={`/inbox/${c.otherUserId}`}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 transition-colors hover:bg-[rgb(var(--color-surface-elevated))]",
                  selected && "bg-[rgba(var(--color-primary),0.08)]",
                  unread && !selected && "bg-[rgba(var(--color-primary),0.03)]"
                )}
              >
                <div className="relative">
                  <Avatar name={c.otherUser.name} />
                  {unread && (
                    <span className="absolute -bottom-0.5 -end-0.5 h-3 w-3 rounded-full border-2 border-[rgb(var(--color-surface))] bg-[rgb(var(--color-primary))]" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className={cn("truncate text-[14px] text-[rgb(var(--color-text))]", unread ? "font-bold" : "font-semibold")}>
                      {c.otherUser.name}
                    </p>
                    <span className={cn("shrink-0 text-[11px]", unread ? "font-semibold text-[rgb(var(--color-primary))]" : "text-[rgb(var(--color-text-muted))]")}>
                      {timeAgo(c.lastMessage.createdAt)}
                    </span>
                  </div>
                  <div className="mt-0.5 flex items-center justify-between gap-2">
                    <p className={cn("truncate text-[13px]", unread ? "font-medium text-[rgb(var(--color-text))]" : "text-[rgb(var(--color-text-muted))]")}>
                      {mine ? "את/ה: " : ""}
                      {messagePreviewText(c.lastMessage.content, c.lastMessage.attachment)}
                    </p>
                    {unread && (
                      <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-[rgb(var(--color-primary))] px-1.5 text-[10px] font-bold text-white">
                        {c.unreadCount > 9 ? "9+" : c.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );

  const thread = peerId ? (
    <div className="flex h-full min-h-0 flex-col bg-[rgb(var(--color-bg))]">
      <div className="flex items-center gap-3 border-b border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] px-4 py-3">
        <button
          type="button"
          className="md:hidden rounded-lg p-1 text-[rgb(var(--color-text-secondary))] hover:bg-[rgb(var(--color-surface-elevated))]"
          onClick={() => router.push("/inbox")}
          aria-label="חזרה לשיחות"
        >
          <CaretRight className="h-5 w-5" />
        </button>
        <Avatar name={peerName} size="sm" />
        <div className="min-w-0">
          <p className="truncate text-[15px] font-bold text-[rgb(var(--color-text))]">{peerName}</p>
          <p className="text-[12px] text-[rgb(var(--color-text-muted))]">שיחה אחת · כל ההודעות ביניכם</p>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <Avatar name={peerName} />
            <p className="mt-3 text-[15px] font-semibold text-[rgb(var(--color-text))]">{peerName}</p>
            <p className="mt-1 text-[13px] text-[rgb(var(--color-text-muted))]">זו תחילת השיחה. תגידו שלום.</p>
          </div>
        ) : (
          <div className="mx-auto flex max-w-2xl flex-col gap-2">
            {messages.map((msg, index) => {
              const prev = messages[index - 1];
              const showDay = !prev || dayKey(prev.createdAt) !== dayKey(msg.createdAt);
              const isMe = msg.senderId === me;
              const showNew = msg.id === newFromId;
              return (
                <div key={msg.id}>
                  {showDay && (
                    <p className="my-3 text-center text-[11px] font-medium text-[rgb(var(--color-text-muted))]">
                      {dayLabel(msg.createdAt)}
                    </p>
                  )}
                  {showNew && (
                    <div className="my-3 flex items-center gap-2">
                      <span className="h-px flex-1 bg-[rgb(var(--color-primary))]" />
                      <span className="text-[11px] font-bold text-[rgb(var(--color-primary))]">הודעות חדשות</span>
                      <span className="h-px flex-1 bg-[rgb(var(--color-primary))]" />
                    </div>
                  )}
                  <div className={cn("flex", isMe ? "justify-end" : "justify-start")}>
                    <div className={cn("max-w-[78%]", isMe ? "items-end" : "items-start")}>
                      {msg.orderId && (
                        <p className={cn("mb-1 text-[11px] text-[rgb(var(--color-text-muted))]", isMe ? "text-end" : "text-start")}>
                          לגבי {orderTitles[msg.orderId] || "הזמנה"}
                        </p>
                      )}
                      <div
                        className={cn(
                          "rounded-2xl px-4 py-2.5 text-[14px] leading-relaxed",
                          isMe
                            ? "rounded-es-md bg-[rgb(var(--color-primary))] text-white"
                            : "rounded-ee-md border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] text-[rgb(var(--color-text))]"
                        )}
                      >
                        {msg.attachment && <AttachmentBubble url={msg.attachment} onPrimary={isMe} />}
                        {msg.content ? msg.content : null}
                      </div>
                      <p className={cn("mt-1 text-[11px] text-[rgb(var(--color-text-muted))]", isMe ? "text-end" : "text-start")}>
                        {new Date(msg.createdAt).toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      <form onSubmit={send} className="border-t border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] px-4 py-3">
        <div className="mx-auto flex max-w-2xl items-end gap-2">
          <ComposerAttach
            value={attachment}
            onChange={setAttachment}
            disabled={sending}
            onError={setAttachError}
            onBusyChange={setAttachBusy}
          />
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={`הודעה אל ${peerName}...`}
            className="min-h-[44px] flex-1 rounded-full border border-[rgb(var(--color-border))] bg-[rgb(var(--color-bg))] px-4 py-2.5 text-[14px] text-[rgb(var(--color-text))] placeholder-[rgb(var(--color-text-muted))] focus:border-[rgb(var(--color-primary))] focus:outline-none focus:ring-2 focus:ring-[rgba(var(--color-primary),0.2)]"
          />
          <button
            type="submit"
            disabled={sending || attachBusy || (!draft.trim() && !attachment)}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-[rgb(var(--color-primary))] text-white transition-opacity hover:bg-[rgb(var(--color-primary-hover))] disabled:opacity-40"
            aria-label="שלח"
          >
            <PaperPlaneTilt className="h-5 w-5" />
          </button>
        </div>
        {attachError && (
          <p className="mx-auto mt-2 max-w-2xl text-[12px] text-[rgb(var(--color-error))]">{attachError}</p>
        )}
        {sendError && (
          <p className="mx-auto mt-2 max-w-2xl text-[12px] text-[rgb(var(--color-error))]">{sendError}</p>
        )}
      </form>
    </div>
  ) : (
    <div className="hidden h-full flex-col items-center justify-center bg-[rgb(var(--color-bg))] text-center md:flex">
      <ChatCircle className="mb-3 h-12 w-12 text-[rgb(var(--color-text-muted))]" />
      <p className="text-[16px] font-semibold text-[rgb(var(--color-text))]">השיחות שלך</p>
      <p className="mt-1 max-w-xs text-[13px] text-[rgb(var(--color-text-muted))]">בחרו מישהו מהרשימה. כל ההודעות ביניכם — כולל הזמנות — בשיחה אחת.</p>
    </div>
  );

  return (
    <div className="mx-auto h-[calc(100vh-7.5rem)] max-w-6xl overflow-hidden border-y border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] md:mt-4 md:rounded-2xl md:border">
      <div className="grid h-full min-h-0 grid-cols-1 md:grid-cols-[minmax(280px,360px)_1fr]">
        <div className={cn("min-h-0", peerId ? "hidden md:block" : "block")}>{list}</div>
        <div className={cn("min-h-0", peerId ? "block" : "hidden md:block")}>{thread}</div>
      </div>
    </div>
  );
}
