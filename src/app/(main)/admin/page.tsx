"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Users, Briefcase, Bag, CurrencyDollar, Prohibit } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { ModerationQueue } from "@/components/admin/moderation-queue";
import type { QueueItem } from "@/lib/moderation-queue";

interface Stats {
  users: number;
  gigs: number;
  orders: number;
  revenue: number;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  suspendedAt: string | null;
}

const STAT_CARDS: {
  label: string;
  key: keyof Stats;
  icon: ReactNode;
  gradient: string;
  format: (v: number) => string;
}[] = [
  {
    label: "משתמשים",
    key: "users",
    icon: <Users className="h-6 w-6 text-[rgb(var(--color-primary))]" />,
    gradient: "from-[rgb(var(--color-primary))] to-[rgb(var(--color-primary-light))]",
    format: (v: number) => v.toString(),
  },
  {
    label: "שירותים",
    key: "gigs",
    icon: <Briefcase className="h-6 w-6 text-[rgb(var(--color-accent))]" />,
    gradient: "from-[rgb(var(--color-accent))] to-[rgb(var(--color-success))]",
    format: (v: number) => v.toString(),
  },
  {
    label: "הזמנות",
    key: "orders",
    icon: <Bag className="h-6 w-6 text-[rgb(var(--color-error))]" />,
    gradient: "from-[rgb(var(--color-error))] to-[rgb(var(--color-accent-yellow))]",
    format: (v: number) => v.toString(),
  },
  {
    label: "הכנסות",
    key: "revenue",
    icon: <CurrencyDollar className="h-6 w-6 text-[rgb(var(--color-accent-yellow))]" />,
    gradient: "from-[rgb(var(--color-accent-yellow))] to-[rgb(var(--color-error))]",
    format: (v: number) => `₪${v.toFixed(2)}`,
  },
];

const ROLE_BADGE: Record<string, { bg: string; text: string }> = {
  ADMIN: { bg: "bg-[rgba(var(--color-error),0.1)]", text: "text-[rgb(var(--color-error))]" },
  SELLER: { bg: "bg-[rgba(var(--color-primary),0.1)]", text: "text-[rgb(var(--color-primary))]" },
  BUYER: { bg: "bg-[rgba(var(--color-accent),0.15)]", text: "text-[rgb(var(--color-success))]" },
};

/** Shows admin stats and a list of users. */
export default function AdminPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [queueItems, setQueueItems] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user?.role !== "ADMIN") return;

    Promise.all([
      fetch("/api/admin/stats").then((r) => r.json()),
      fetch("/api/admin/users").then((r) => r.json()),
      fetch("/api/admin/queue").then((r) => r.json()),
    ]).then(([statsData, usersData, queueData]) => {
      setStats(statsData);
      setUsers(usersData);
      setQueueItems(Array.isArray(queueData.items) ? queueData.items : []);
      setLoading(false);
    });
  }, [session]);

  if (!session || session.user.role !== "ADMIN") {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="rounded-full bg-[rgba(var(--color-error),0.1)] p-4 mb-4">
          <Prohibit className="h-8 w-8 text-[rgb(var(--color-error))]" />
        </div>
        <p className="text-[16px] font-medium text-[rgb(var(--color-text))]">הגישה נדחתה</p>
        <p className="mt-1 text-[14px] text-[rgb(var(--color-text-muted))]">אתה צריך הרשאות מנהל כדי לצפות בדף הזה</p>
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

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-[32px] font-bold tracking-[-0.01em] text-[rgb(var(--color-text))]">לוח בקרה</h1>
        <p className="mt-1 text-[14px] text-[rgb(var(--color-text-secondary))]">סקירה כללית של השוק שלך</p>
      </div>

      {/* Stats Grid */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STAT_CARDS.map((stat) => (
          <div
            key={stat.label}
            className="relative overflow-hidden rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] p-6 shadow-[var(--shadow-sm)]"
          >
            <div
              className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${stat.gradient}`}
            />
            <div className="flex items-center justify-between mb-3">
              <div className="rounded-xl bg-[rgb(var(--color-surface-elevated))] border border-[rgb(var(--color-border-light))] p-2.5">
                {stat.icon}
              </div>
            </div>
            <p className="text-[12px] font-medium uppercase tracking-[0.05em] text-[rgb(var(--color-text-muted))]">
              {stat.label}
            </p>
            <p className="mt-1 text-[32px] font-bold tracking-[-0.01em] text-[rgb(var(--color-text))]">
              {stat.format(stats?.[stat.key] || 0)}
            </p>
          </div>
        ))}
      </div>

      <ModerationQueue
        items={queueItems}
        onRefresh={() => {
          fetch("/api/admin/queue")
            .then((r) => r.json())
            .then((queueData) => setQueueItems(Array.isArray(queueData.items) ? queueData.items : []));
          fetch("/api/admin/users")
            .then((r) => r.json())
            .then(setUsers);
        }}
      />

      {/* Users Table */}
      <div className="overflow-hidden rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] shadow-[var(--shadow-sm)]">
        <div className="flex items-center justify-between border-b border-[rgb(var(--color-border))] px-6 py-4">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-[rgb(var(--color-primary))]" />
            <h2 className="text-[16px] font-bold text-[rgb(var(--color-text))]">משתמשים</h2>
            <span className="rounded-full bg-[rgba(var(--color-primary),0.1)] px-2.5 py-0.5 text-[12px] font-semibold text-[rgb(var(--color-primary))]">
              {users.length}
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[rgb(var(--color-border-light))] bg-[rgb(var(--color-surface-elevated))]">
                <th className="px-6 py-3.5 text-[12px] font-semibold uppercase tracking-[0.05em] text-[rgb(var(--color-text-muted))]">שם</th>
                <th className="px-6 py-3.5 text-[12px] font-semibold uppercase tracking-[0.05em] text-[rgb(var(--color-text-muted))]">אימייל</th>
                <th className="px-6 py-3.5 text-[12px] font-semibold uppercase tracking-[0.05em] text-[rgb(var(--color-text-muted))]">תפקיד</th>
                <th className="px-6 py-3.5 text-[12px] font-semibold uppercase tracking-[0.05em] text-[rgb(var(--color-text-muted))]">הצטרף</th>
                <th className="px-6 py-3.5 text-[12px] font-semibold uppercase tracking-[0.05em] text-[rgb(var(--color-text-muted))]">פעולות</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgb(var(--color-border-light))]">
              {users.map((user) => {
                const roleBadge = ROLE_BADGE[user.role] || ROLE_BADGE.BUYER;
                return (
                  <tr key={user.id} className="transition-colors hover:bg-[rgb(var(--color-surface-elevated))]">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[rgb(var(--color-primary))] to-[rgb(var(--color-primary-light))] text-[13px] font-bold text-white">
                          {user.name[0]}
                        </div>
                        <span className="text-[14px] font-semibold text-[rgb(var(--color-text))]">{user.name}</span>
                        {user.suspendedAt && (
                          <span className="rounded-full bg-[rgba(var(--color-error),0.1)] px-2 py-0.5 text-[11px] font-semibold text-[rgb(var(--color-error))]">מושעה</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-[14px] text-[rgb(var(--color-text-secondary))]">{user.email}</td>
                    <td className="px-6 py-4">
                      <span className={`rounded-full px-3 py-1 text-[12px] font-semibold ${roleBadge.bg} ${roleBadge.text}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[14px] text-[rgb(var(--color-text-secondary))]">
                      {new Date(user.createdAt).toLocaleDateString("he-IL")}
                    </td>
                    <td className="px-6 py-4">
                      {user.role !== "ADMIN" && (
                        user.suspendedAt ? (
                          <button
                            onClick={async () => {
                              const res = await fetch(`/api/admin/users/${user.id}/unsuspend`, { method: "POST" });
                              if (res.ok) {
                                const updated = await res.json();
                                setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, ...updated } : u));
                              }
                            }}
                            className="text-[12px] font-semibold text-[rgb(var(--color-primary))] hover:underline"
                          >
                            בטל השעיה
                          </button>
                        ) : (
                          <button
                            onClick={async () => {
                              if (!confirm(`להשעות את ${user.name}?`)) return;
                              const res = await fetch(`/api/admin/users/${user.id}/suspend`, {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ reason: "הושעה מלוח הניהול" }),
                              });
                              if (res.ok) {
                                const updated = await res.json();
                                setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, ...updated } : u));
                              }
                            }}
                            className="text-[12px] font-semibold text-[rgb(var(--color-error))] hover:underline"
                          >
                            השעה
                          </button>
                        )
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
