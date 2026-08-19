import { NextResponse } from "next/server";
import { proxyRequest, GIGS_SERVICE } from "@/lib/gateway";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data, status } = await proxyRequest(GIGS_SERVICE, `/gigs/${id}/related`);
  return NextResponse.json(data, { status });
}
