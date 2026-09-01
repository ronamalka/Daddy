import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { proxyRequest, ORDERS_SERVICE } from "@/lib/gateway";
import { renderInvoiceHtml } from "@/lib/invoice-template";

/** Returns the invoice as an HTML page that can be printed to PDF. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = session.user as { id: string; email: string; name: string; role: string };
  const { data, status } = await proxyRequest(ORDERS_SERVICE, `/orders/${id}/invoice`, { user });

  if (status !== 200 || !data) {
    return NextResponse.json(data ?? { error: "Invoice not found" }, { status });
  }

  const html = renderInvoiceHtml(data);

  return new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
    },
  });
}
