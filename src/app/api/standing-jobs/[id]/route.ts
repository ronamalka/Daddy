import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { proxyRequest, ORDERS_SERVICE, USERS_SERVICE } from "@/lib/gateway";
import { validateBody } from "@/lib/validate";
import { standingJobPatchSchema } from "@/lib/standing-job-api";
import {
  bookableOccurrences,
  horizonGap,
  isFuturePendingOrder,
  occurrenceOrderPayload,
  planOccurrences,
  STANDING_HORIZON,
} from "@/lib/standing-job";
import { loadStandingContext } from "@/lib/standing-job-context";

type AuthUser = { id: string; email: string; name: string; role: string };

type StandingOrder = {
  id: string;
  status: string;
  slotStart: string | null;
  price: number;
};

type StandingJobRow = {
  id: string;
  buyerId: string;
  sellerId: string;
  serviceSlug: string;
  title: string;
  frequency: "WEEKLY" | "BIWEEKLY" | "MONTHLY";
  weekday: number;
  startMin: number;
  status: string;
  orders?: StandingOrder[];
};

async function sessionUser() {
  const session = await auth();
  if (!session?.user) return null;
  return session.user as AuthUser;
}

async function enrichPeople(job: StandingJobRow) {
  const [buyerRes, sellerRes] = await Promise.all([
    proxyRequest(USERS_SERVICE, `/sellers/${job.buyerId}`),
    proxyRequest(USERS_SERVICE, `/sellers/${job.sellerId}`),
  ]);
  return {
    ...job,
    buyer: { id: job.buyerId, name: buyerRes.data?.name || "משתמש", avatar: buyerRes.data?.avatar || null },
    seller: { id: job.sellerId, name: sellerRes.data?.name || "משתמש", avatar: sellerRes.data?.avatar || null },
  };
}

/** Creates more pending visits when an active job has fallen below the horizon. */
async function fillHorizon(job: StandingJobRow, user: AuthUser) {
  if (job.status !== "ACTIVE") return job;
  const upcoming = (job.orders || []).filter((row) => isFuturePendingOrder(row)).length;
  const needed = horizonGap(upcoming, STANDING_HORIZON);
  if (needed === 0) return job;

  const ctx = await loadStandingContext({
    sellerId: job.sellerId,
    serviceSlug: job.serviceSlug,
    title: job.title,
  });
  if (!ctx.price) return job;

  const planned = planOccurrences({
    frequency: job.frequency,
    weekday: job.weekday,
    startMin: job.startMin,
    after: new Date(),
    weeklyHours: ctx.weeklyHours,
    timeOff: ctx.timeOff,
    bookedSlots: ctx.bookedSlots,
    horizon: needed,
  });
  const bookable = bookableOccurrences(planned).slice(0, needed);
  if (bookable.length === 0) return job;

  const { data, status } = await proxyRequest(ORDERS_SERVICE, `/standing-jobs/${job.id}/occurrences`, {
    method: "POST",
    body: { occurrences: bookable.map((row) => occurrenceOrderPayload(row, ctx.price!)) },
    user,
  });
  if (status >= 200 && status < 300 && data?.id) return data as StandingJobRow;
  return job;
}

/** Returns one standing job, filling upcoming visits if the schedule is still active. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await sessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, status } = await proxyRequest(ORDERS_SERVICE, `/standing-jobs/${id}`, { user });
  if (status !== 200 || !data?.id) {
    return NextResponse.json(data ?? { error: "Standing job not found" }, { status });
  }

  const filled = await fillHorizon(data as StandingJobRow, user);
  return NextResponse.json(await enrichPeople(filled));
}

/** Pause, resume, or cancel future visits. Resume books the next horizon at the current price. */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await sessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await validateBody(request, standingJobPatchSchema);
  if ("error" in result) return result.error;

  const { data, status } = await proxyRequest(ORDERS_SERVICE, `/standing-jobs/${id}`, {
    method: "PATCH",
    body: result.data,
    user,
  });
  if (status !== 200 || !data?.id) {
    return NextResponse.json(data ?? { error: "Failed to update standing job" }, { status });
  }

  let job = data as StandingJobRow;
  if (result.data.action === "resume") {
    job = await fillHorizon(job, user);
  }
  return NextResponse.json(await enrichPeople(job));
}
