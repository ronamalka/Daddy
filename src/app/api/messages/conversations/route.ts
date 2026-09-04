import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { proxyRequest, CHAT_SERVICE, USERS_SERVICE } from "@/lib/gateway";

type ConversationRow = {
  otherUserId: string;
  unreadCount: number;
  lastMessage: {
    id: string;
    content: string;
    attachment: string | null;
    senderId: string;
    receiverId: string;
    orderId: string | null;
    createdAt: string;
  };
};

/** Returns the signed-in user's chat threads with the other person's name and avatar. */
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = session.user as { id: string; email: string; name: string; role: string };
  const { data, status } = await proxyRequest(CHAT_SERVICE, "/messages/conversations", { user });
  if (!Array.isArray(data)) {
    return NextResponse.json(data ?? { error: "Failed to load conversations" }, { status });
  }

  const conversations = data as ConversationRow[];
  const ids = [...new Set(conversations.map((row) => row.otherUserId))];
  const people = await Promise.all(
    ids.map(async (id) => {
      const { data: person } = await proxyRequest(USERS_SERVICE, `/sellers/${id}`);
      return [
        id,
        {
          id,
          name: typeof person?.name === "string" ? person.name : "משתמש",
          avatar: person?.avatar ?? null,
        },
      ] as const;
    })
  );
  const personMap = Object.fromEntries(people);

  return NextResponse.json(
    conversations.map((row) => ({
      ...row,
      otherUser: personMap[row.otherUserId] || { id: row.otherUserId, name: "משתמש", avatar: null },
    })),
    { status }
  );
}
