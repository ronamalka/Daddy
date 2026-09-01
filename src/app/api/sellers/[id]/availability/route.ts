import { NextResponse } from "next/server";
import { proxyRequest, USERS_SERVICE, ORDERS_SERVICE } from "@/lib/gateway";
import { generateAvailableSlots, type WeeklyHours, type TimeOffDate } from "@/lib/availability";

/** Returns a seller's open visit slots, weekly hours, time off, and booked times. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [availabilityRes, bookedRes] = await Promise.all([
    proxyRequest(USERS_SERVICE, `/availability/${id}`),
    proxyRequest(ORDERS_SERVICE, `/orders/booked-slots/${id}`),
  ]);

  if (availabilityRes.status === 404 || !availabilityRes.data || availabilityRes.data.error) {
    return NextResponse.json({ error: "Seller not found" }, { status: 404 });
  }

  const weeklyHours: WeeklyHours[] = Array.isArray(availabilityRes.data.weeklyHours)
    ? availabilityRes.data.weeklyHours
    : [];
  const timeOff: TimeOffDate[] = Array.isArray(availabilityRes.data.timeOff)
    ? availabilityRes.data.timeOff
    : [];
  const bookedSlots = Array.isArray(bookedRes.data) ? bookedRes.data : [];

  const slots = generateAvailableSlots({
    weeklyHours,
    timeOff,
    bookedSlots,
  }).map((slot) => ({
    slotStart: slot.slotStart.toISOString(),
    slotEnd: slot.slotEnd.toISOString(),
    date: slot.date,
    startMin: slot.startMin,
    label: slot.label,
  }));

  return NextResponse.json({
    acceptingJobs: availabilityRes.data.acceptingJobs !== false,
    weeklyHours,
    timeOff,
    bookedSlots,
    slots,
  });
}
