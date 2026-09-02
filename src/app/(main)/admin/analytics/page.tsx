"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
  Users,
  Bag,
  CurrencyDollar,
  ChartLine,
  ArrowUp,
  ArrowDown,
  Funnel,
  Prohibit,
  Crown,
} from "@phosphor-icons/react";
import Link from "next/link";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

interface OverviewData {
  users: {
    totalUsers: number;
    newSignups7d: number;
    newSignupsPrev7d: number;
    newSignups30d: number;
    newSignupsPrev30d: number;
    byRole: Record<string, number>;
    activePremiumSubscriptions: number;
  };
  orders: {
    totalOrders: number;
    ordersThisMonth: number;
    ordersPrevMonth: number;
    revenueThisMonth: number;
    revenuePrevMonth: number;
    commissionThisMonth: number;
    commissionPrevMonth: number;
    completedThisMonth: number;
    completedPrevMonth: number;
    avgOrderValue: number;
    avgOrderValuePrev: number;
    conversionRate: number;
    conversionRatePrev: number;
  };
}

interface TimeseriesData {
  signups: { series: { date: string; total: number; buyers: number; sellers: number }[] };
  orders: { series: { date: string; orders: number; completed: number; revenue: number; commission: number }[] };
}

interface BreakdownData {
  ordersByStatus: Record<string, number>;
  usersByRole: Record<string, number>;
}

interface RevenueData {
  commission: {
    totalCollected: number;
    avgPerOrder: number;
    totalRevenue: number;
    effectiveRate: number;
    completedOrders: number;
    byRate: Record<string, { count: number; total: number }>;
  };
  subscriptions: {
    byTier: Record<string, number>;
    mrr: number;
    premiumPrice: number;
  };
  ltv: {
    avgBuyerSpend: number;
    avgSellerEarnings: number;
    uniqueBuyers: number;
    uniqueSellers: number;
    totalGMV: number;
    totalBuyers: number;
    totalSellers: number;
  };
}

interface FunnelData {
  steps: { name: string; count: number }[];
}

type Tab = "overview" | "timeseries" | "revenue" | "funnel";

const TAB_LABELS: Record<Tab, string> = {
  overview: "סקירה כללית",
  timeseries: "מגמות",
  revenue: "הכנסות",
  funnel: "משפך",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "ממתין",
  IN_PROGRESS: "בעבודה",
  ON_THE_WAY: "בדרך",
  DELIVERED: "סופק",
  COMPLETED: "הושלם",
  CANCELLED: "בוטל",
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: "#f59e0b",
  IN_PROGRESS: "#3b82f6",
  ON_THE_WAY: "#8b5cf6",
  DELIVERED: "#06b6d4",
  COMPLETED: "#22c55e",
  CANCELLED: "#ef4444",
};

const PIE_COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

function pctChange(current: number, previous: number): { value: number; positive: boolean } {
  if (previous === 0) return { value: current > 0 ? 100 : 0, positive: current >= 0 };
  const change = Math.round(((current - previous) / previous) * 100);
  return { value: Math.abs(change), positive: change >= 0 };
}

function StatCard({
  label,
  value,
  prevValue,
  format = "number",
  icon,
}: {
  label: string;
  value: number;
  prevValue?: number;
  format?: "number" | "currency" | "percent";
  icon: React.ReactNode;
}) {
  const formatted =
    format === "currency"
      ? `₪${value.toLocaleString("he-IL")}`
      : format === "percent"
        ? `${value}%`
        : value.toLocaleString("he-IL");

  const change = prevValue != null ? pctChange(value, prevValue) : null;

  return (
    <div className="relative overflow-hidden rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] p-5 shadow-[var(--shadow-sm)]">
      <div className="flex items-center justify-between mb-3">
        <div className="rounded-xl bg-[rgb(var(--color-surface-elevated))] border border-[rgb(var(--color-border-light))] p-2.5">
          {icon}
        </div>
        {change && (
          <div
            className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[12px] font-semibold ${
              change.positive
                ? "bg-[rgba(var(--color-success),0.1)] text-[rgb(var(--color-success))]"
                : "bg-[rgba(var(--color-error),0.1)] text-[rgb(var(--color-error))]"
            }`}
          >
            {change.positive ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
            {change.value}%
          </div>
        )}
      </div>
      <p className="text-[12px] font-medium uppercase tracking-[0.05em] text-[rgb(var(--color-text-muted))]">
        {label}
      </p>
      <p className="mt-1 text-[28px] font-bold tracking-[-0.01em] text-[rgb(var(--color-text))]">
        {formatted}
      </p>
    </div>
  );
}

function FunnelStep({ name, count, maxCount }: { name: string; count: number; maxCount: number }) {
  const width = maxCount > 0 ? Math.max((count / maxCount) * 100, 8) : 8;
  const labels: Record<string, string> = {
    signed_up: "נרשמו",
    posted_request: "פרסמו בקשה",
    order_created: "נוצרה הזמנה",
    order_completed: "הזמנה הושלמה",
  };

  return (
    <div className="flex items-center gap-4 py-2">
      <div className="w-32 text-[14px] font-medium text-[rgb(var(--color-text-secondary))] text-left">
        {labels[name] || name}
      </div>
      <div className="flex-1">
        <div
          className="h-8 rounded-lg bg-primary flex items-center justify-end px-3 transition-all duration-500"
          style={{ width: `${width}%` }}
        >
          <span className="text-[13px] font-bold text-white">{count}</span>
        </div>
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [timeseries, setTimeseries] = useState<TimeseriesData | null>(null);
  const [breakdowns, setBreakdowns] = useState<BreakdownData | null>(null);
  const [revenueData, setRevenueData] = useState<RevenueData | null>(null);
  const [funnelData, setFunnelData] = useState<FunnelData | null>(null);

  const fetchSection = useCallback(
    async (section: string, params?: Record<string, string>) => {
      const qs = new URLSearchParams({ section, ...params });
      const res = await fetch(`/api/admin/analytics?${qs}`);
      if (!res.ok) return null;
      return res.json();
    },
    [],
  );

  useEffect(() => {
    if (session?.user?.role !== "ADMIN") return;

    setLoading(true);
    Promise.all([
      fetchSection("overview"),
      fetchSection("timeseries", { days: "90" }),
      fetchSection("breakdowns"),
      fetchSection("revenue"),
      fetchSection("funnel", { period: "30" }),
    ]).then(([ov, ts, br, rev, fn]) => {
      setOverview(ov);
      setTimeseries(ts);
      setBreakdowns(br);
      setRevenueData(rev);
      setFunnelData(fn);
      setLoading(false);
    });
  }, [session, fetchSection]);

  if (!session || session.user.role !== "ADMIN") {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="rounded-full bg-[rgba(var(--color-error),0.1)] p-4 mb-4">
          <Prohibit className="h-8 w-8 text-[rgb(var(--color-error))]" />
        </div>
        <p className="text-[16px] font-medium text-[rgb(var(--color-text))]">הגישה נדחתה</p>
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

  const u = overview?.users;
  const o = overview?.orders;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8" dir="rtl">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-[28px] font-bold tracking-[-0.01em] text-[rgb(var(--color-text))]">
            <ChartLine className="inline-block h-7 w-7 ml-2 text-[rgb(var(--color-primary))]" />
            אנליטיקס
          </h1>
          <p className="mt-1 text-[14px] text-[rgb(var(--color-text-secondary))]">
            נתונים ותובנות על הפלטפורמה
          </p>
        </div>
        <Link
          href="/admin"
          className="rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] px-4 py-2 text-[14px] font-semibold text-[rgb(var(--color-text))] hover:border-[rgb(var(--color-primary))] transition-all"
        >
          חזרה ללוח בקרה
        </Link>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-2 border-b border-[rgb(var(--color-border))] pb-0">
        {(Object.keys(TAB_LABELS) as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-[14px] font-semibold transition-all border-b-2 -mb-px ${
              activeTab === tab
                ? "border-[rgb(var(--color-primary))] text-[rgb(var(--color-primary))]"
                : "border-transparent text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-text))]"
            }`}
          >
            {TAB_LABELS[tab]}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && u && o && (
        <div className="space-y-8">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="הרשמות חדשות (7 ימים)"
              value={u.newSignups7d}
              prevValue={u.newSignupsPrev7d}
              icon={<Users className="h-5 w-5 text-[rgb(var(--color-primary))]" />}
            />
            <StatCard
              label="הזמנות החודש"
              value={o.ordersThisMonth}
              prevValue={o.ordersPrevMonth}
              icon={<Bag className="h-5 w-5 text-[rgb(var(--color-accent))]" />}
            />
            <StatCard
              label="הכנסות החודש"
              value={o.revenueThisMonth}
              prevValue={o.revenuePrevMonth}
              format="currency"
              icon={<CurrencyDollar className="h-5 w-5 text-[rgb(var(--color-success))]" />}
            />
            <StatCard
              label="עמלות החודש"
              value={o.commissionThisMonth}
              prevValue={o.commissionPrevMonth}
              format="currency"
              icon={<Crown className="h-5 w-5 text-[rgb(var(--color-accent-yellow))]" />}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="סה״כ משתמשים"
              value={u.totalUsers}
              icon={<Users className="h-5 w-5 text-[rgb(var(--color-primary))]" />}
            />
            <StatCard
              label="ממוצע להזמנה"
              value={o.avgOrderValue}
              prevValue={o.avgOrderValuePrev}
              format="currency"
              icon={<CurrencyDollar className="h-5 w-5 text-[rgb(var(--color-accent))]" />}
            />
            <StatCard
              label="אחוז המרה"
              value={o.conversionRate}
              prevValue={o.conversionRatePrev}
              format="percent"
              icon={<Funnel className="h-5 w-5 text-[rgb(var(--color-success))]" />}
            />
            <StatCard
              label="מנויי פרימיום"
              value={u.activePremiumSubscriptions}
              icon={<Crown className="h-5 w-5 text-[rgb(var(--color-accent-yellow))]" />}
            />
          </div>

          {/* Breakdowns */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Orders by Status */}
            {breakdowns?.ordersByStatus && (
              <div className="rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] p-6 shadow-[var(--shadow-sm)]">
                <h3 className="text-[16px] font-bold text-[rgb(var(--color-text))] mb-4">הזמנות לפי סטטוס</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={Object.entries(breakdowns.ordersByStatus)
                        .filter(([, v]) => v > 0)
                        .map(([name, value]) => ({
                          name: STATUS_LABELS[name] || name,
                          value,
                        }))}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {Object.entries(breakdowns.ordersByStatus)
                        .filter(([, v]) => v > 0)
                        .map(([name]) => (
                          <Cell key={name} fill={STATUS_COLORS[name] || "#94a3b8"} />
                        ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Users by Role */}
            {breakdowns?.usersByRole && (
              <div className="rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] p-6 shadow-[var(--shadow-sm)]">
                <h3 className="text-[16px] font-bold text-[rgb(var(--color-text))] mb-4">משתמשים לפי תפקיד</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={Object.entries(breakdowns.usersByRole).map(([name, value]) => ({
                        name: name === "BUYER" ? "קונים" : name === "SELLER" ? "בעלי מקצוע" : "מנהלים",
                        value,
                      }))}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {Object.entries(breakdowns.usersByRole).map(([, ], i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "timeseries" && timeseries && (
        <div className="space-y-8">
          {/* Signups Trend */}
          <div className="rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] p-6 shadow-[var(--shadow-sm)]">
            <h3 className="text-[16px] font-bold text-[rgb(var(--color-text))] mb-4">הרשמות יומיות (90 ימים)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={timeseries.signups.series}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(var(--color-border),0.5)" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(d) => d.slice(5)}
                />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  labelFormatter={(d) => new Date(d as string).toLocaleDateString("he-IL")}
                  formatter={(value, name) => [
                    String(value ?? 0),
                    name === "buyers" ? "קונים" : name === "sellers" ? "בעלי מקצוע" : "סה״כ",
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="#3b82f6"
                  fill="rgba(59,130,246,0.1)"
                  strokeWidth={2}
                  name="total"
                />
                <Area
                  type="monotone"
                  dataKey="buyers"
                  stroke="#22c55e"
                  fill="rgba(34,197,94,0.1)"
                  strokeWidth={1.5}
                  name="buyers"
                />
                <Area
                  type="monotone"
                  dataKey="sellers"
                  stroke="#f59e0b"
                  fill="rgba(245,158,11,0.1)"
                  strokeWidth={1.5}
                  name="sellers"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Orders & Revenue Trend */}
          <div className="rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] p-6 shadow-[var(--shadow-sm)]">
            <h3 className="text-[16px] font-bold text-[rgb(var(--color-text))] mb-4">הזמנות יומיות (90 ימים)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={timeseries.orders.series}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(var(--color-border),0.5)" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(d) => d.slice(5)}
                />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  labelFormatter={(d) => new Date(d as string).toLocaleDateString("he-IL")}
                  formatter={(value, name) => [
                    String(value ?? 0),
                    name === "orders" ? "הזמנות" : "הושלמו",
                  ]}
                />
                <Bar dataKey="orders" fill="#3b82f6" name="orders" radius={[2, 2, 0, 0]} />
                <Bar dataKey="completed" fill="#22c55e" name="completed" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Revenue Trend */}
          <div className="rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] p-6 shadow-[var(--shadow-sm)]">
            <h3 className="text-[16px] font-bold text-[rgb(var(--color-text))] mb-4">הכנסות יומיות (₪)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={timeseries.orders.series}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(var(--color-border),0.5)" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(d) => d.slice(5)}
                />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  labelFormatter={(d) => new Date(d as string).toLocaleDateString("he-IL")}
                  formatter={(value, name) => [
                    `₪${Number(value ?? 0).toLocaleString("he-IL")}`,
                    name === "revenue" ? "הכנסות" : "עמלות",
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#22c55e"
                  fill="rgba(34,197,94,0.1)"
                  strokeWidth={2}
                  name="revenue"
                />
                <Area
                  type="monotone"
                  dataKey="commission"
                  stroke="#f59e0b"
                  fill="rgba(245,158,11,0.1)"
                  strokeWidth={2}
                  name="commission"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {activeTab === "revenue" && revenueData && (
        <div className="space-y-8">
          {/* Commission & Subscription KPIs */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="סה״כ עמלות נגבו"
              value={revenueData.commission.totalCollected}
              format="currency"
              icon={<CurrencyDollar className="h-5 w-5 text-[rgb(var(--color-success))]" />}
            />
            <StatCard
              label="ממוצע עמלה להזמנה"
              value={revenueData.commission.avgPerOrder}
              format="currency"
              icon={<CurrencyDollar className="h-5 w-5 text-[rgb(var(--color-accent))]" />}
            />
            <StatCard
              label="MRR (מנויים)"
              value={revenueData.subscriptions.mrr}
              format="currency"
              icon={<Crown className="h-5 w-5 text-[rgb(var(--color-accent-yellow))]" />}
            />
            <StatCard
              label="GMV כולל"
              value={revenueData.ltv.totalGMV}
              format="currency"
              icon={<ChartLine className="h-5 w-5 text-[rgb(var(--color-primary))]" />}
            />
          </div>

          {/* LTV Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="ממוצע הוצאה לקונה"
              value={revenueData.ltv.avgBuyerSpend}
              format="currency"
              icon={<Users className="h-5 w-5 text-[rgb(var(--color-primary))]" />}
            />
            <StatCard
              label="ממוצע הכנסה לבעל מקצוע"
              value={revenueData.ltv.avgSellerEarnings}
              format="currency"
              icon={<Users className="h-5 w-5 text-[rgb(var(--color-success))]" />}
            />
            <StatCard
              label="קונים ייחודיים"
              value={revenueData.ltv.uniqueBuyers}
              icon={<Users className="h-5 w-5 text-[rgb(var(--color-accent))]" />}
            />
            <StatCard
              label="בעלי מקצוע ייחודיים"
              value={revenueData.ltv.uniqueSellers}
              icon={<Users className="h-5 w-5 text-[rgb(var(--color-accent-yellow))]" />}
            />
          </div>

          {/* Commission by Rate */}
          {revenueData.commission.byRate && Object.keys(revenueData.commission.byRate).length > 0 && (
            <div className="rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] p-6 shadow-[var(--shadow-sm)]">
              <h3 className="text-[16px] font-bold text-[rgb(var(--color-text))] mb-4">עמלות לפי שיעור</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-right">
                  <thead>
                    <tr className="border-b border-[rgb(var(--color-border-light))]">
                      <th className="px-4 py-3 text-[12px] font-semibold uppercase tracking-[0.05em] text-[rgb(var(--color-text-muted))]">
                        שיעור עמלה
                      </th>
                      <th className="px-4 py-3 text-[12px] font-semibold uppercase tracking-[0.05em] text-[rgb(var(--color-text-muted))]">
                        הזמנות
                      </th>
                      <th className="px-4 py-3 text-[12px] font-semibold uppercase tracking-[0.05em] text-[rgb(var(--color-text-muted))]">
                        סה״כ עמלות
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[rgb(var(--color-border-light))]">
                    {Object.entries(revenueData.commission.byRate).map(([rate, data]) => (
                      <tr key={rate} className="hover:bg-[rgb(var(--color-surface-elevated))]">
                        <td className="px-4 py-3 text-[14px] font-medium text-[rgb(var(--color-text))]">{rate}</td>
                        <td className="px-4 py-3 text-[14px] text-[rgb(var(--color-text-secondary))]">
                          {data.count.toLocaleString("he-IL")}
                        </td>
                        <td className="px-4 py-3 text-[14px] font-semibold text-[rgb(var(--color-success))]">
                          ₪{data.total.toLocaleString("he-IL")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Subscription Breakdown */}
          <div className="rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] p-6 shadow-[var(--shadow-sm)]">
            <h3 className="text-[16px] font-bold text-[rgb(var(--color-text))] mb-4">מנויים</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-lg bg-[rgb(var(--color-surface-elevated))] p-4 text-center">
                <p className="text-[12px] font-medium uppercase tracking-[0.05em] text-[rgb(var(--color-text-muted))]">
                  חינם
                </p>
                <p className="mt-1 text-[24px] font-bold text-[rgb(var(--color-text))]">
                  {revenueData.subscriptions.byTier.FREE || 0}
                </p>
              </div>
              <div className="rounded-lg bg-[rgb(var(--color-surface-elevated))] p-4 text-center">
                <p className="text-[12px] font-medium uppercase tracking-[0.05em] text-[rgb(var(--color-text-muted))]">
                  פרימיום
                </p>
                <p className="mt-1 text-[24px] font-bold text-[rgb(var(--color-accent-yellow))]">
                  {revenueData.subscriptions.byTier.PREMIUM || 0}
                </p>
              </div>
              <div className="rounded-lg bg-[rgb(var(--color-surface-elevated))] p-4 text-center">
                <p className="text-[12px] font-medium uppercase tracking-[0.05em] text-[rgb(var(--color-text-muted))]">
                  MRR
                </p>
                <p className="mt-1 text-[24px] font-bold text-[rgb(var(--color-success))]">
                  ₪{revenueData.subscriptions.mrr.toLocaleString("he-IL")}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "funnel" && funnelData && (
        <div className="space-y-8">
          <div className="rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] p-6 shadow-[var(--shadow-sm)]">
            <h3 className="text-[16px] font-bold text-[rgb(var(--color-text))] mb-6">משפך המרה (30 ימים)</h3>
            {funnelData.steps.length > 0 ? (
              <div className="space-y-2">
                {funnelData.steps.map((step) => (
                  <FunnelStep
                    key={step.name}
                    name={step.name}
                    count={step.count}
                    maxCount={Math.max(...funnelData.steps.map((s) => s.count), 1)}
                  />
                ))}
              </div>
            ) : (
              <p className="text-[14px] text-[rgb(var(--color-text-muted))] text-center py-8">
                אין נתוני משפך לתקופה הזו
              </p>
            )}

            {/* Conversion rates between steps */}
            {funnelData.steps.length > 1 && (
              <div className="mt-8 pt-6 border-t border-[rgb(var(--color-border-light))]">
                <h4 className="text-[14px] font-semibold text-[rgb(var(--color-text))] mb-3">
                  אחוזי המרה בין שלבים
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {funnelData.steps.slice(1).map((step, i) => {
                    const prev = funnelData.steps[i];
                    const rate = prev.count > 0 ? Math.round((step.count / prev.count) * 100) : 0;
                    const stepLabels: Record<string, string> = {
                      posted_request: "הרשמה → בקשה",
                      order_created: "בקשה → הזמנה",
                      order_completed: "הזמנה → השלמה",
                    };
                    return (
                      <div
                        key={step.name}
                        className="rounded-lg bg-[rgb(var(--color-surface-elevated))] p-3 text-center"
                      >
                        <p className="text-[12px] text-[rgb(var(--color-text-muted))]">
                          {stepLabels[step.name] || `${prev.name} → ${step.name}`}
                        </p>
                        <p className="mt-1 text-[20px] font-bold text-[rgb(var(--color-primary))]">{rate}%</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
