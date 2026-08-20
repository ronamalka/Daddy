import { NextResponse } from "next/server";
import { z } from "zod";
import { proxyRequest, USERS_SERVICE } from "@/lib/gateway";
import { validateBody } from "@/lib/validate";

const registerSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email().max(254),
  password: z.string().min(8).max(128),
  role: z.enum(["BUYER", "SELLER"]),
}).strict();

export async function POST(request: Request) {
  const result = await validateBody(request, registerSchema);
  if ("error" in result) return result.error;

  const { data, status } = await proxyRequest(USERS_SERVICE, "/register", {
    method: "POST",
    body: result.data,
  });
  return NextResponse.json(data ?? { error: "Service unavailable" }, { status });
}
