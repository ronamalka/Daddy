"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Bell, ChatCircle, Package, ArrowsClockwise, CheckCircle, Handshake } from "@phosphor-icons/react";
import { AnimatePresence, motion } from "framer-motion";
import { DropdownMenu } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  href?: string;
  orderId?: string;
  createdAt: string;
  read: boolean;
}

const TYPE_ICON: Record<string, React.ReactNode> = {
  NEW_ORDER: <Package className="h-4 w-4 text-[rgb(var(--color-primary))]" weight="fill" />,
  REVISION_REQUESTED: <ArrowsClockwise className="h-4 w-4 text-[rgb(var(--color-warning))]" />,
  ORDER_DELIVERED: <CheckCircle className="h-4 w-4 text-[rgb(var(--color-success))]" weight="fill" />,
  ORDER_ACCEPTED: <Handshake className="h-4 w-4 text-[rgb(var(--color-primary))]" />,
  NEW_MESSAGE: <ChatCircle className="h-4 w-4 text-[rgb(var(--color-primary))]" weight="fill" />,
};

/** Shows a bell with a dropdown of the user's latest order and chat alerts. */
export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  const fetchNotifications = useCallback(() => {
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setNotifications(data);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const unreadCount = notifications.filter((n) => !readIds.has(n.id)).length;

  /** Opens or closes the menu and marks items as read when it opens. */
  function handleOpen(isOpen: boolean) {
    setOpen(isOpen);
    if (isOpen) {
      setReadIds(new Set(notifications.map((n) => n.id)));
    }
  }

  /** Turns a date into a short Hebrew relative time, like "5 min ago". */
  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "עכשיו";
    if (minutes < 60) return `לפני ${minutes} דק׳`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `לפני ${hours} שע׳`;
    const days = Math.floor(hours / 24);
    return `לפני ${days} ימים`;
  }

  return (
    <DropdownMenu
      open={open}
      onOpenChange={handleOpen}
      align="start"
      className="w-[340px] max-h-[420px] overflow-y-auto"
      trigger={
        <button className="relative flex h-9 w-9 items-center justify-center rounded-lg text-[rgb(var(--color-text-secondary))] transition-colors hover:bg-[rgb(var(--color-surface-elevated))] hover:text-[rgb(var(--color-text))]">
          <Bell className="h-5 w-5" />
          <AnimatePresence>
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -top-0.5 -end-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[rgb(var(--color-error))] px-1 text-[10px] font-bold text-white"
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      }
    >
      <div className="border-b border-[rgb(var(--color-border-light))] px-4 py-3">
        <h3 className="text-[14px] font-bold text-[rgb(var(--color-text))]">התראות</h3>
      </div>
      {notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 px-4">
          <Bell className="mb-2 h-8 w-8 text-[rgb(var(--color-text-muted))]" />
          <p className="text-[13px] text-[rgb(var(--color-text-muted))]">אין התראות חדשות</p>
        </div>
      ) : (
        <div className="py-1">
          {notifications.map((n) => (
            <Link
              key={n.id}
              href={n.href || (n.orderId ? `/orders/${n.orderId}` : "/inbox")}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-start gap-3 px-4 py-3 transition-colors hover:bg-[rgb(var(--color-surface-elevated))]",
                !readIds.has(n.id) && "bg-[rgba(var(--color-primary),0.04)]"
              )}
            >
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[rgb(var(--color-surface-elevated))]">
                {TYPE_ICON[n.type] || <Bell className="h-4 w-4 text-[rgb(var(--color-text-muted))]" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold text-[rgb(var(--color-text))]">{n.title}</p>
                <p className="mt-0.5 text-[12px] leading-relaxed text-[rgb(var(--color-text-secondary))] line-clamp-2">{n.message}</p>
                <p className="mt-1 text-[11px] text-[rgb(var(--color-text-muted))]">{timeAgo(n.createdAt)}</p>
              </div>
              {!readIds.has(n.id) && (
                <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[rgb(var(--color-primary))]" />
              )}
            </Link>
          ))}
        </div>
      )}
    </DropdownMenu>
  );
}
