"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

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
}

const STAT_CARDS = [
  {
    label: "משתמשים",
    key: "users" as const,
    icon: (
      <svg className="h-6 w-6 text-[#6C5CE7]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
      </svg>
    ),
    gradient: "from-[#6C5CE7] to-[#A29BFE]",
    format: (v: number) => v.toString(),
  },
  {
    label: "שירותים",
    key: "gigs" as const,
    icon: (
      <svg className="h-6 w-6 text-[#00D2D3]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z" />
      </svg>
    ),
    gradient: "from-[#00D2D3] to-[#00B894]",
    format: (v: number) => v.toString(),
  },
  {
    label: "הזמנות",
    key: "orders" as const,
    icon: (
      <svg className="h-6 w-6 text-[#FF6B6B]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
      </svg>
    ),
    gradient: "from-[#FF6B6B] to-[#FECA57]",
    format: (v: number) => v.toString(),
  },
  {
    label: "הכנסות",
    key: "revenue" as const,
    icon: (
      <svg className="h-6 w-6 text-[#FECA57]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    gradient: "from-[#FECA57] to-[#FF6B6B]",
    format: (v: number) => `₪${v.toFixed(2)}`,
  },
];

const ROLE_BADGE: Record<string, { bg: string; text: string }> = {
  ADMIN: { bg: "bg-[#FF6B6B]/10", text: "text-[#FF6B6B]" },
  SELLER: { bg: "bg-[#6C5CE7]/10", text: "text-[#6C5CE7]" },
  BUYER: { bg: "bg-[#00D2D3]/15", text: "text-[#00B894]" },
};

export default function AdminPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user?.role !== "ADMIN") return;

    Promise.all([
      fetch("/api/admin/stats").then((r) => r.json()),
      fetch("/api/admin/users").then((r) => r.json()),
    ]).then(([statsData, usersData]) => {
      setStats(statsData);
      setUsers(usersData);
      setLoading(false);
    });
  }, [session]);

  if (!session || session.user.role !== "ADMIN") {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="rounded-full bg-[#E17055]/10 p-4 mb-4">
          <svg className="h-8 w-8 text-[#E17055]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
        </div>
        <p className="text-[16px] font-medium text-[#2D3436]">הגישה נדחתה</p>
        <p className="mt-1 text-[14px] text-[#B2BEC3]">אתה צריך הרשאות מנהל כדי לצפות בדף הזה</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#F0EEFF] border-t-[#6C5CE7]" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-[32px] font-bold tracking-[-0.01em] text-[#2D3436]">לוח בקרה</h1>
        <p className="mt-1 text-[14px] text-[#636E72]">סקירה כללית של השוק שלך</p>
      </div>

      {/* Stats Grid */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STAT_CARDS.map((stat) => (
          <div
            key={stat.label}
            className="relative overflow-hidden rounded-[16px] border border-[#E8ECF1] bg-[#FFFFFF] p-6 shadow-[0_2px_8px_rgba(108,92,231,0.06)]"
          >
            {/* Gradient accent bar */}
            <div
              className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${stat.gradient}`}
            />
            <div className="flex items-center justify-between mb-3">
              <div className="rounded-[12px] bg-[#FAFBFF] border border-[#F1F3F8] p-2.5">
                {stat.icon}
              </div>
            </div>
            <p className="text-[12px] font-medium uppercase tracking-[0.05em] text-[#B2BEC3]">
              {stat.label}
            </p>
            <p className="mt-1 text-[32px] font-bold tracking-[-0.01em] text-[#2D3436]">
              {stat.format(stats?.[stat.key] || 0)}
            </p>
          </div>
        ))}
      </div>

      {/* Users Table */}
      <div className="overflow-hidden rounded-[16px] border border-[#E8ECF1] bg-[#FFFFFF] shadow-[0_2px_8px_rgba(108,92,231,0.06)]">
        <div className="flex items-center justify-between border-b border-[#E8ECF1] px-6 py-4">
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5 text-[#6C5CE7]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
            <h2 className="text-[16px] font-bold text-[#2D3436]">משתמשים</h2>
            <span className="rounded-[9999px] bg-[#F0EEFF] px-2.5 py-0.5 text-[12px] font-semibold text-[#6C5CE7]">
              {users.length}
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[#F1F3F8] bg-[#FAFBFF]">
                <th className="px-6 py-3.5 text-[12px] font-semibold uppercase tracking-[0.05em] text-[#B2BEC3]">שם</th>
                <th className="px-6 py-3.5 text-[12px] font-semibold uppercase tracking-[0.05em] text-[#B2BEC3]">אימייל</th>
                <th className="px-6 py-3.5 text-[12px] font-semibold uppercase tracking-[0.05em] text-[#B2BEC3]">תפקיד</th>
                <th className="px-6 py-3.5 text-[12px] font-semibold uppercase tracking-[0.05em] text-[#B2BEC3]">הצטרף</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F3F8]">
              {users.map((user) => {
                const roleBadge = ROLE_BADGE[user.role] || ROLE_BADGE.BUYER;
                return (
                  <tr key={user.id} className="transition-colors hover:bg-[#FAFBFF]">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#6C5CE7] to-[#A29BFE] text-[13px] font-bold text-white">
                          {user.name[0]}
                        </div>
                        <span className="text-[14px] font-semibold text-[#2D3436]">{user.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-[14px] text-[#636E72]">{user.email}</td>
                    <td className="px-6 py-4">
                      <span className={`rounded-[9999px] px-3 py-1 text-[12px] font-semibold ${roleBadge.bg} ${roleBadge.text}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[14px] text-[#636E72]">
                      {new Date(user.createdAt).toLocaleDateString()}
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
