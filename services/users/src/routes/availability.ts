import { Router, Request, Response } from "express";
import { requireAuth, requireSeller } from "../../../shared/middleware";
import { prisma } from "../index";

export const availabilityRoutes = Router();

const MAX_TIME_OFF = 90;

function serializeAvailability(
  acceptingJobs: boolean,
  weeklyHours: { dayOfWeek: number; startMin: number; endMin: number }[],
  timeOff: { date: string; note: string | null }[]
) {
  return {
    acceptingJobs,
    weeklyHours: weeklyHours
      .map((row) => ({
        dayOfWeek: row.dayOfWeek,
        startMin: row.startMin,
        endMin: row.endMin,
      }))
      .sort((a, b) => a.dayOfWeek - b.dayOfWeek),
    timeOff: timeOff
      .map((row) => ({ date: row.date, note: row.note }))
      .sort((a, b) => a.date.localeCompare(b.date)),
  };
}

availabilityRoutes.get("/", requireAuth, async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      acceptingJobs: true,
      weeklyHours: true,
      timeOff: true,
    },
  });

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json(serializeAvailability(user.acceptingJobs, user.weeklyHours, user.timeOff));
});

availabilityRoutes.put("/", requireAuth, requireSeller, async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { acceptingJobs, weeklyHours, timeOff } = req.body as {
    acceptingJobs?: unknown;
    weeklyHours?: unknown;
    timeOff?: unknown;
  };

  if (typeof acceptingJobs !== "boolean") {
    res.status(400).json({ error: "acceptingJobs must be a boolean" });
    return;
  }

  if (!Array.isArray(weeklyHours) || weeklyHours.length > 7) {
    res.status(400).json({ error: "Invalid weeklyHours" });
    return;
  }

  if (!Array.isArray(timeOff) || timeOff.length > MAX_TIME_OFF) {
    res.status(400).json({ error: "Invalid timeOff" });
    return;
  }

  const hoursRows: { userId: string; dayOfWeek: number; startMin: number; endMin: number }[] = [];
  const seenDays = new Set<number>();

  for (const row of weeklyHours) {
    const dayOfWeek = Number((row as { dayOfWeek?: unknown }).dayOfWeek);
    const startMin = Number((row as { startMin?: unknown }).startMin);
    const endMin = Number((row as { endMin?: unknown }).endMin);

    if (
      !Number.isInteger(dayOfWeek) ||
      dayOfWeek < 0 ||
      dayOfWeek > 6 ||
      seenDays.has(dayOfWeek) ||
      !Number.isInteger(startMin) ||
      !Number.isInteger(endMin) ||
      startMin < 0 ||
      startMin > 1439 ||
      endMin <= startMin ||
      endMin > 1440
    ) {
      res.status(400).json({ error: "Invalid weeklyHours entry" });
      return;
    }

    seenDays.add(dayOfWeek);
    hoursRows.push({ userId, dayOfWeek, startMin, endMin });
  }

  const timeOffRows: { userId: string; date: string; note: string | null }[] = [];
  const seenDates = new Set<string>();
  const dateKey = /^\d{4}-\d{2}-\d{2}$/;

  for (const row of timeOff) {
    const date = String((row as { date?: unknown }).date ?? "");
    const noteRaw = (row as { note?: unknown }).note;
    if (!dateKey.test(date) || seenDates.has(date)) {
      res.status(400).json({ error: "Invalid timeOff entry" });
      return;
    }
    seenDates.add(date);
    timeOffRows.push({
      userId,
      date,
      note: typeof noteRaw === "string" && noteRaw.trim() ? noteRaw.trim().slice(0, 200) : null,
    });
  }

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: { acceptingJobs },
    });
    await tx.weeklyHours.deleteMany({ where: { userId } });
    await tx.timeOff.deleteMany({ where: { userId } });
    if (hoursRows.length > 0) {
      await tx.weeklyHours.createMany({ data: hoursRows });
    }
    if (timeOffRows.length > 0) {
      await tx.timeOff.createMany({ data: timeOffRows });
    }
  });

  const saved = await prisma.user.findUnique({
    where: { id: userId },
    select: { acceptingJobs: true, weeklyHours: true, timeOff: true },
  });

  res.json(serializeAvailability(saved!.acceptingJobs, saved!.weeklyHours, saved!.timeOff));
});

availabilityRoutes.get("/:sellerId", async (req: Request, res: Response) => {
  const sellerId = req.params.sellerId as string;

  const user = await prisma.user.findUnique({
    where: { id: sellerId },
    select: {
      role: true,
      acceptingJobs: true,
      weeklyHours: true,
      timeOff: true,
    },
  });

  if (!user || (user.role !== "SELLER" && user.role !== "ADMIN")) {
    res.status(404).json({ error: "Seller not found" });
    return;
  }

  res.json(serializeAvailability(user.acceptingJobs, user.weeklyHours, user.timeOff));
});
