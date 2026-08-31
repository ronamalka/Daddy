export type NotificationItem = {
  id: string;
  type: string;
  title: string;
  message: string;
  href: string;
  createdAt: string;
  read: boolean;
};

export type PersistedNotificationRow = {
  id: string;
  type: string;
  title?: string;
  message?: string;
  href?: string;
  createdAt?: string | Date;
  readAt?: string | Date | null;
};

/** Maps a persisted users-service notification into the header-bell feed shape. */
export function mapPersistedNotification(row: PersistedNotificationRow): NotificationItem {
  const createdAt =
    row.createdAt instanceof Date
      ? row.createdAt.toISOString()
      : row.createdAt || new Date().toISOString();
  return {
    id: row.id,
    type: row.type,
    title: row.title || "",
    message: row.message || "",
    href: row.href || "/",
    createdAt,
    read: Boolean(row.readAt),
  };
}

/** Newest first, persisted nearby-request rows mixed with derived order/chat alerts. */
export function mergeNotificationFeed(
  persisted: NotificationItem[],
  derived: NotificationItem[],
  limit = 20
): NotificationItem[] {
  return [...persisted, ...derived]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);
}
