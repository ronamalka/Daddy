import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { proxyRequest, ORDERS_SERVICE, GIGS_SERVICE, USERS_SERVICE } from "@/lib/gateway";
import { mergeQueueItems, type DisputeQueueSource, type FlagQueueSource } from "@/lib/moderation-queue";

/** Unified admin queue: disputes, review flags, and (later) ID checks. */
export async function GET() {
  const session = await auth();
  if (!session?.user || (session.user as { role: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const user = session.user as { id: string; email: string; name: string; role: string };

  const [disputesRes, flagsRes, usersRes] = await Promise.all([
    proxyRequest(ORDERS_SERVICE, "/admin/disputes", { user }),
    proxyRequest(GIGS_SERVICE, "/reviews/admin/flags", { user }),
    proxyRequest(USERS_SERVICE, "/admin/users", { user }),
  ]);

  if (disputesRes.status === 502 || flagsRes.status === 502) {
    return NextResponse.json({ error: "שירות לא זמין" }, { status: 502 });
  }

  const names: Record<string, string> = {};
  if (Array.isArray(usersRes.data)) {
    for (const u of usersRes.data as { id: string; name: string }[]) {
      names[u.id] = u.name;
    }
  }

  const disputes = Array.isArray(disputesRes.data) ? (disputesRes.data as DisputeQueueSource[]) : [];
  const flags = Array.isArray(flagsRes.data) ? (flagsRes.data as FlagQueueSource[]) : [];
  const items = mergeQueueItems(disputes, flags, names);

  return NextResponse.json({
    items,
    counts: {
      disputes: disputes.length,
      flags: flags.length,
      idChecks: 0,
      open: items.filter((i) => i.status === "OPEN" || i.status === "UNDER_REVIEW").length,
    },
  });
}
