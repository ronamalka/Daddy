import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { proxyRequest, USERS_SERVICE } from "@/lib/gateway";
import { validateBody } from "@/lib/validate";

const createAddressSchema = z.object({
  label: z.string().min(1, "יש להזין שם לכתובת"),
  cityCode: z.number().int().optional(),
  cityName: z.string().optional(),
  districtCode: z.number().int().optional(),
  districtName: z.string().optional(),
  street: z.string().optional(),
  floor: z.string().optional(),
  accessNotes: z.string().optional(),
});

/** Returns the signed-in user's saved addresses. */
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = session.user as { id: string; email: string; name: string; role: string };
  const { data, status } = await proxyRequest(USERS_SERVICE, "/addresses", { user });
  return NextResponse.json(data, { status });
}

/** Creates a new saved address for the signed-in user. */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await validateBody(request, createAddressSchema);
  if ("error" in result) return result.error;

  const user = session.user as { id: string; email: string; name: string; role: string };
  const { data, status } = await proxyRequest(USERS_SERVICE, "/addresses", {
    method: "POST",
    body: result.data,
    user,
  });
  return NextResponse.json(data, { status });
}
