import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { proxyRequest, USERS_SERVICE } from "@/lib/gateway";
import { validateBody } from "@/lib/validate";

const profileUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  phone: z.string().max(20).optional(),
  bio: z.string().max(1000).optional(),
  avatar: z.string().url().max(500).optional().nullable(),
  location: z.string().max(100).optional(),
}).strict();

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, status } = await proxyRequest(USERS_SERVICE, "/profile", {
    user: session.user as { id: string; email: string; name: string; role: string },
  });
  return NextResponse.json(data, { status });
}

export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await validateBody(request, profileUpdateSchema);
  if ("error" in result) return result.error;

  const { data, status } = await proxyRequest(USERS_SERVICE, "/profile", {
    method: "PUT",
    body: result.data,
    user: session.user as { id: string; email: string; name: string; role: string },
  });
  return NextResponse.json(data, { status });
}
