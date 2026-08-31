"use client";

import { useState } from "react";
import Link from "next/link";
import { Flag, Scales, IdentificationCard, Prohibit } from "@phosphor-icons/react";
import { Dialog } from "@/components/ui/dialog";
import {
  DISPUTE_REASON_LABELS,
  DISPUTE_STATUS_LABELS,
  isOpenDisputeStatus,
} from "@/lib/disputes";
import {
  filterQueueItems,
  FLAG_STATUS_LABELS,
  QUEUE_TYPE_LABELS,
  type QueueItem,
  type QueueItemType,
  type QueueStatusFilter,
  type QueueTypeFilter,
} from "@/lib/moderation-queue";

interface ModerationQueueProps {
  items: QueueItem[];
  onRefresh: () => void;
}

const TYPE_FILTERS: { id: QueueTypeFilter; label: string }[] = [
  { id: "ALL", label: "הכל" },
  { id: "DISPUTE", label: "מחלוקות" },
  { id: "REVIEW_FLAG", label: "דיווחי ביקורות" },
  { id: "ID_CHECK", label: "בדיקות זהות" },
];

const STATUS_FILTERS: { id: QueueStatusFilter; label: string }[] = [
  { id: "OPEN", label: "פתוח" },
  { id: "CLOSED", label: "טופל" },
  { id: "ALL", label: "כל הסטטוסים" },
];

/** Staff queue for disputes, review flags, and identity checks. */
export function ModerationQueue({ items, onRefresh }: ModerationQueueProps) {
  const [type, setType] = useState<QueueTypeFilter>("ALL");
  const [status, setStatus] = useState<QueueStatusFilter>("OPEN");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [splitItem, setSplitItem] = useState<QueueItem | null>(null);
  const [splitAmount, setSplitAmount] = useState("");
  const [error, setError] = useState("");

  const visible = filterQueueItems(items, type, status);

  /** Runs a dispute or flag action, then reloads the queue. */
  async function act(item: QueueItem, action: string, extra?: Record<string, unknown>) {
    setBusyId(item.id);
    setError("");
    const path = item.type === "DISPUTE"
      ? `/api/admin/disputes/${item.id}`
      : `/api/admin/flags/${item.id}`;
    const res = await fetch(path, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...extra }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "הפעולה נכשלה");
    } else {
      onRefresh();
    }
    setBusyId(null);
  }

  /** Suspends the subject user from this queue row. */
  async function suspend(userId: string) {
    if (!confirm("להשעות את המשתמש? הוא לא יוכל להתחבר.")) return;
    setError("");
    const res = await fetch(`/api/admin/users/${userId}/suspend`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: "הושעה מתור הניהול" }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "ההשעיה נכשלה");
      return;
    }
    onRefresh();
  }

  return (
    <div className="mb-8 overflow-hidden rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] shadow-[var(--shadow-sm)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[rgb(var(--color-border))] px-6 py-4">
        <div className="flex items-center gap-2">
          <Scales className="h-5 w-5 text-[rgb(var(--color-primary))]" />
          <h2 className="text-[16px] font-bold text-[rgb(var(--color-text))]">תור ניהול</h2>
          <span className="rounded-full bg-[rgba(var(--color-primary),0.1)] px-2.5 py-0.5 text-[12px] font-semibold text-[rgb(var(--color-primary))]">
            {filterQueueItems(items, "ALL", "OPEN").length} פתוחים
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {TYPE_FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setType(f.id)}
              className={`rounded-full px-3 py-1 text-[12px] font-semibold ${
                type === f.id
                  ? "bg-[rgb(var(--color-primary))] text-white"
                  : "bg-[rgb(var(--color-surface-elevated))] text-[rgb(var(--color-text-secondary))]"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2 border-b border-[rgb(var(--color-border-light))] px-6 py-3">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setStatus(f.id)}
            className={`text-[12px] font-semibold ${
              status === f.id ? "text-[rgb(var(--color-primary))]" : "text-[rgb(var(--color-text-muted))]"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {error && (
        <p className="px-6 py-3 text-[13px] text-[rgb(var(--color-error))]">{error}</p>
      )}

      {type === "ID_CHECK" && visible.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
          <IdentificationCard className="mb-3 h-8 w-8 text-[rgb(var(--color-text-muted))]" />
          <p className="text-[14px] font-medium text-[rgb(var(--color-text))]">אין בדיקות זהות ממתינות</p>
          <p className="mt-1 text-[13px] text-[rgb(var(--color-text-muted))]">
            תור זה יתמלא כשתופעל בדיקת תעודה ומספר טלפון
          </p>
        </div>
      ) : visible.length === 0 ? (
        <p className="px-6 py-10 text-center text-[14px] text-[rgb(var(--color-text-muted))]">אין פריטים בתור</p>
      ) : (
        <ul className="divide-y divide-[rgb(var(--color-border-light))]">
          {visible.map((item) => (
            <QueueRow
              key={`${item.type}-${item.id}`}
              item={item}
              busy={busyId === item.id}
              onAct={act}
              onSplit={() => { setSplitItem(item); setSplitAmount(""); }}
              onSuspend={suspend}
            />
          ))}
        </ul>
      )}

      <Dialog open={!!splitItem} onOpenChange={(o) => { if (!o) setSplitItem(null); }} labelledBy="split-dialog-title">
        {splitItem && (
          <div className="pt-2">
            <h3 id="split-dialog-title" className="mb-2 text-[16px] font-bold text-[rgb(var(--color-text))]">פיצול תשלום</h3>
            <p className="mb-4 text-[13px] text-[rgb(var(--color-text-secondary))]">
              מחיר ההזמנה ₪{splitItem.orderPrice}. הזינו כמה יוחזר ללקוח. התשלום עצמו עדיין לא פעיל — הפעולה תירשם בלבד.
            </p>
            <input
              type="number"
              min={0}
              max={splitItem.orderPrice}
              value={splitAmount}
              onChange={(e) => setSplitAmount(e.target.value)}
              className="mb-4 w-full rounded-xl border border-[rgb(var(--color-border))] px-4 py-2.5 text-[14px]"
              placeholder="סכום ללקוח"
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  const amount = Number(splitAmount);
                  if (!splitItem) return;
                  act(splitItem, "split", { splitBuyerAmount: amount });
                  setSplitItem(null);
                }}
                className="flex-1 rounded-xl bg-[rgb(var(--color-primary))] px-4 py-2.5 text-[14px] font-semibold text-white"
              >
                אשר פיצול
              </button>
              <button
                onClick={() => setSplitItem(null)}
                className="rounded-xl border border-[rgb(var(--color-border))] px-4 py-2.5 text-[14px]"
              >
                ביטול
              </button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}

function QueueRow({
  item,
  busy,
  onAct,
  onSplit,
  onSuspend,
}: {
  item: QueueItem;
  busy: boolean;
  onAct: (item: QueueItem, action: string) => void;
  onSplit: () => void;
  onSuspend: (userId: string) => void;
}) {
  const open = isOpenDisputeStatus(item.status) || item.status === "OPEN" || item.status === "UNDER_REVIEW";
  const statusLabel = item.type === "REVIEW_FLAG"
    ? FLAG_STATUS_LABELS[item.status] || item.status
    : DISPUTE_STATUS_LABELS[item.status] || item.status;
  const reasonLabel = item.type === "DISPUTE"
    ? DISPUTE_REASON_LABELS[item.reason as keyof typeof DISPUTE_REASON_LABELS] || item.reason
    : item.reason;
  const TypeIcon = item.type === "DISPUTE" ? Scales : Flag;

  return (
    <li className="px-6 py-4">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1 rounded-full bg-[rgba(var(--color-primary),0.1)] px-2.5 py-0.5 text-[11px] font-semibold text-[rgb(var(--color-primary))]">
          <TypeIcon className="h-3.5 w-3.5" />
          {QUEUE_TYPE_LABELS[item.type as QueueItemType]}
        </span>
        <span className="rounded-full bg-[rgb(var(--color-surface-elevated))] px-2.5 py-0.5 text-[11px] font-semibold text-[rgb(var(--color-text-secondary))]">
          {statusLabel}
        </span>
        <span className="text-[12px] text-[rgb(var(--color-text-muted))]">
          {new Date(item.createdAt).toLocaleString("he-IL")}
        </span>
      </div>
      <p className="text-[14px] font-semibold text-[rgb(var(--color-text))]">{item.title}</p>
      <p className="mt-1 text-[13px] text-[rgb(var(--color-text-secondary))]">
        <span className="font-semibold">{reasonLabel}</span>
        {item.description ? ` — ${item.description}` : ""}
      </p>
      <p className="mt-1 text-[12px] text-[rgb(var(--color-text-muted))]">
        פתח: {item.opener?.name || "—"}
        {item.counterpart ? ` · צד שני: ${item.counterpart.name}` : ""}
      </p>
      {item.photos.length > 0 && (
        <div className="mt-2 flex gap-2">
          {item.photos.map((url) => (
            <a key={url} href={url} target="_blank" rel="noopener noreferrer">
              <img src={url} alt="" className="h-14 w-14 rounded-lg object-cover" />
            </a>
          ))}
        </div>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        {item.orderId && (
          <Link href={`/orders/${item.orderId}`} className="rounded-lg border border-[rgb(var(--color-border))] px-3 py-1.5 text-[12px] font-semibold text-[rgb(var(--color-primary))]">
            להזמנה
          </Link>
        )}
        {open && item.type === "DISPUTE" && (
          <>
            {item.status === "OPEN" && (
              <button disabled={busy} onClick={() => onAct(item, "review")} className="rounded-lg bg-[rgb(var(--color-surface-elevated))] px-3 py-1.5 text-[12px] font-semibold disabled:opacity-40">
                בטיפול
              </button>
            )}
            <button disabled={busy} onClick={() => onAct(item, "release")} className="rounded-lg bg-[rgba(var(--color-success),0.15)] px-3 py-1.5 text-[12px] font-semibold text-[rgb(var(--color-success))] disabled:opacity-40">
              שחרור לספק
            </button>
            <button disabled={busy} onClick={() => onAct(item, "refund")} className="rounded-lg bg-[rgba(var(--color-error),0.1)] px-3 py-1.5 text-[12px] font-semibold text-[rgb(var(--color-error))] disabled:opacity-40">
              החזר ללקוח
            </button>
            <button disabled={busy} onClick={onSplit} className="rounded-lg bg-[rgba(var(--color-accent-yellow),0.2)] px-3 py-1.5 text-[12px] font-semibold text-[rgb(var(--color-warning))] disabled:opacity-40">
              פיצול
            </button>
            <button disabled={busy} onClick={() => onAct(item, "close")} className="rounded-lg border border-[rgb(var(--color-border))] px-3 py-1.5 text-[12px] font-semibold disabled:opacity-40">
              סגירה
            </button>
          </>
        )}
        {open && item.type === "REVIEW_FLAG" && (
          <>
            {item.status === "OPEN" && (
              <button disabled={busy} onClick={() => onAct(item, "review")} className="rounded-lg bg-[rgb(var(--color-surface-elevated))] px-3 py-1.5 text-[12px] font-semibold disabled:opacity-40">
                בטיפול
              </button>
            )}
            <button disabled={busy} onClick={() => onAct(item, "dismiss")} className="rounded-lg border border-[rgb(var(--color-border))] px-3 py-1.5 text-[12px] font-semibold disabled:opacity-40">
              דחה דיווח
            </button>
            <button disabled={busy} onClick={() => onAct(item, "hide")} className="rounded-lg bg-[rgba(var(--color-error),0.1)] px-3 py-1.5 text-[12px] font-semibold text-[rgb(var(--color-error))] disabled:opacity-40">
              הסתר ביקורת
            </button>
          </>
        )}
        {item.subjectUser && (
          <button
            onClick={() => onSuspend(item.subjectUser!.id)}
            className="inline-flex items-center gap-1 rounded-lg border border-[rgba(var(--color-error),0.3)] px-3 py-1.5 text-[12px] font-semibold text-[rgb(var(--color-error))]"
          >
            <Prohibit className="h-3.5 w-3.5" />
            השעה את {item.subjectUser.name}
          </button>
        )}
      </div>
      {item.type === "DISPUTE" && open && (
        <p className="mt-2 text-[11px] text-[rgb(var(--color-text-muted))]">
          תשלומים עדיין לא פעילים — שחרור / החזר / פיצול נרשמים בסטטוס בלבד.
        </p>
      )}
    </li>
  );
}
