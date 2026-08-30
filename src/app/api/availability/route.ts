import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { proxyRequest, USERS_SERVICE } from "@/lib/gateway";
import { validateBody } from "@/lib/validate";
import { isDateKey } from "@/lib/availability";

const weeklyHoursSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startMin: z.number().int().min(0).max(1439),
  endMin: z.number().int().min(1).max(1440),
}).refine((row) => row.endMin > row.startMin, { message: "endMin must be after startMin" });

const timeOffSchema = z.object({
  date: z.string().refine(isDateKey, "Invalid date"),
  note: z.string().max(200).optional().nullable(),
});

const saveAvailabilitySchema = z.object({
  acceptingJobs: z.boolean(),
  weeklyHours: z.array(weeklyHoursSchema).max(7),
  timeOff: z.array(timeOffSchema).max(90),
}).strict();

/** Returns the signed-in seller's weekly hours, time off, and accepting-jobs flag. */
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = session.user as { id: string; email: string; name: string; role: string };
  const { data, status } = await proxyRequest(USERS_SERVICE, "/availability", { user });
  return NextResponse.json(data, { status });
}

/** Saves the signed-in seller's availability. Sellers and admins only. */
export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await validateBody(request, saveAvailabilitySchema);
  if ("error" in result) return result.error;

  const user = session.user as { id: string; email: string; name: string; role: string };
  if (user.role !== "SELLER" && user.role !== "ADMIN") {
    return NextResponse.json({ error: "רק אבאל׳ות יכולים לעדכן זמינות" }, { status: 403 });
  }

  const { data, status } = await proxyRequest(USERS_SERVICE, "/availability", {
    method: "PUT",
    body: result.data,
    user,
  });
  return NextResponse.json(data, { status });
}
