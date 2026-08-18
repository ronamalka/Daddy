import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

async function resolveUserId(session: { user: { id?: string; email?: string | null } }) {
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (user) return user.id;
  if (session.user.email) {
    const byEmail = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (byEmail) return byEmail.id;
  }
  return null;
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = await resolveUserId(session);
  if (!userId) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const { id } = await params;
  const { message, proposedPrice } = await request.json();

  if (!message?.trim()) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  const serviceRequest = await prisma.serviceRequest.findUnique({ where: { id } });
  if (!serviceRequest) {
    return NextResponse.json({ error: "Request not found" }, { status: 404 });
  }

  if (serviceRequest.buyerId === userId) {
    return NextResponse.json({ error: "Cannot respond to your own request" }, { status: 400 });
  }

  const existing = await prisma.requestResponse.findUnique({
    where: { requestId_sellerId: { requestId: id, sellerId: userId } },
  });

  if (existing) {
    return NextResponse.json({ error: "You already responded" }, { status: 400 });
  }

  const response = await prisma.requestResponse.create({
    data: {
      requestId: id,
      sellerId: userId,
      message,
      proposedPrice: proposedPrice ? Number(proposedPrice) : null,
    },
    include: {
      seller: { select: { id: true, name: true, avatar: true } },
    },
  });

  return NextResponse.json(response);
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const serviceRequest = await prisma.serviceRequest.findUnique({
    where: { id },
    include: {
      buyer: { select: { id: true, name: true } },
      responses: {
        include: {
          seller: { select: { id: true, name: true, avatar: true } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!serviceRequest) {
    return NextResponse.json({ error: "Request not found" }, { status: 404 });
  }

  return NextResponse.json({ request: serviceRequest });
}
