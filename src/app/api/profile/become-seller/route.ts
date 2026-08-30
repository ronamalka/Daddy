import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { proxyRequest, USERS_SERVICE } from "@/lib/gateway";
import { validateBody } from "@/lib/validate";

const becomeSellerSchema = z.object({
  independentContractor: z.literal(true),
});

/** Upgrades the signed-in buyer to a seller after independent-contractor confirmation. */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await validateBody(request, becomeSellerSchema);
  if ("error" in result) return result.error;

  const { data, status } = await proxyRequest(USERS_SERVICE, "/profile/become-seller", {
    method: "POST",
    body: result.data,
    user: session.user as { id: string; email: string; name: string; role: string },
  });
  return NextResponse.json(data ?? { error: "Service unavailable" }, { status });
}
