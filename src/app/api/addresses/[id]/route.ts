import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { proxyRequest, USERS_SERVICE } from "@/lib/gateway";
import { validateBody } from "@/lib/validate";

const updateAddressSchema = z.object({
  label: z.string().min(1, "יש להזין שם לכתובת").optional(),
  cityCode: z.number().int().nullable().optional(),
  cityName: z.string().nullable().optional(),
  districtCode: z.number().int().nullable().optional(),
  districtName: z.string().nullable().optional(),
  street: z.string().nullable().optional(),
  floor: z.string().nullable().optional(),
  accessNotes: z.string().nullable().optional(),
});

/** Updates a saved address. */
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await validateBody(request, updateAddressSchema);
  if ("error" in result) return result.error;

  const user = session.user as { id: string; email: string; name: string; role: string };
  const { data, status } = await proxyRequest(USERS_SERVICE, `/addresses/${id}`, {
    method: "PUT",
    body: result.data,
    user,
  });
  return NextResponse.json(data, { status });
}

/** Deletes a saved address. */
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = session.user as { id: string; email: string; name: string; role: string };
  const { data, status } = await proxyRequest(USERS_SERVICE, `/addresses/${id}`, {
    method: "DELETE",
    user,
  });
  return NextResponse.json(data, { status });
}
