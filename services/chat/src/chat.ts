export const MAX_MESSAGE_LENGTH = 5000;

export type MessageRecord = {
  id: string;
  content: string;
  attachment: string | null;
  orderId: string | null;
  senderId: string;
  receiverId: string;
  readAt: Date | null;
  createdAt: Date;
};

export type SendMessageInput = {
  senderId: string;
  senderRole?: string;
  receiverId: string;
  content: string;
  orderId?: string | null;
};

export type ListMessagesInput = {
  userId: string;
  role?: string;
  withUser?: string;
  orderId?: string;
};

export type MarkReadInput = {
  userId: string;
  orderId?: string;
  senderId?: string;
};

export interface MessageRepo {
  create(data: {
    content: string;
    senderId: string;
    receiverId: string;
    orderId: string | null;
  }): Promise<MessageRecord>;
  findMany(args: {
    orderId?: string | null;
    userId: string;
    withUser?: string;
    isAdmin?: boolean;
  }): Promise<MessageRecord[]>;
  countUnread(userId: string): Promise<number>;
  markRead(args: { userId: string; orderId?: string; senderId?: string }): Promise<number>;
}

export type ChatResult<T> =
  | { ok: true; status: number; data: T }
  | { ok: false; status: number; error: string };

function trimContent(content: unknown): string {
  return typeof content === "string" ? content.trim() : "";
}

export function sendMessage(repo: MessageRepo, input: SendMessageInput): Promise<ChatResult<MessageRecord>> {
  const content = trimContent(input.content);
  const { senderId, receiverId, orderId } = input;

  if (!receiverId || !content) {
    return Promise.resolve({ ok: false, status: 400, error: "receiverId and content required" });
  }
  if (typeof receiverId !== "string" || receiverId.length > 64) {
    return Promise.resolve({ ok: false, status: 400, error: "Invalid receiverId" });
  }
  if (content.length > MAX_MESSAGE_LENGTH) {
    return Promise.resolve({ ok: false, status: 400, error: "Message too long" });
  }
  if (receiverId === senderId) {
    return Promise.resolve({ ok: false, status: 400, error: "Cannot message yourself" });
  }

  return repo.create({
    content,
    senderId,
    receiverId,
    orderId: orderId || null,
  }).then((data) => ({ ok: true as const, status: 201, data }));
}

export function listMessages(repo: MessageRepo, input: ListMessagesInput): Promise<ChatResult<MessageRecord[]>> {
  return repo.findMany({
    userId: input.userId,
    withUser: input.withUser,
    orderId: input.orderId,
    isAdmin: input.role === "ADMIN",
  }).then((data) => ({ ok: true as const, status: 200, data }));
}

export function unreadCount(repo: MessageRepo, userId: string): Promise<ChatResult<{ count: number }>> {
  return repo.countUnread(userId).then((count) => ({ ok: true as const, status: 200, data: { count } }));
}

export function markRead(repo: MessageRepo, input: MarkReadInput): Promise<ChatResult<{ marked: number }>> {
  if (!input.orderId && !input.senderId) {
    return Promise.resolve({ ok: false, status: 400, error: "orderId or senderId required" });
  }

  return repo.markRead({
    userId: input.userId,
    orderId: input.orderId,
    senderId: input.senderId,
  }).then((marked) => ({ ok: true as const, status: 200, data: { marked } }));
}

export function createInMemoryRepo(): MessageRepo & { records: MessageRecord[] } {
  const records: MessageRecord[] = [];
  let seq = 0;

  function matchesParty(msg: MessageRecord, userId: string, withUser?: string) {
    if (!withUser) {
      return msg.senderId === userId || msg.receiverId === userId;
    }
    return (
      (msg.senderId === userId && msg.receiverId === withUser) ||
      (msg.senderId === withUser && msg.receiverId === userId)
    );
  }

  return {
    records,
    async create(data) {
      const message: MessageRecord = {
        id: `msg-${++seq}`,
        content: data.content,
        attachment: null,
        orderId: data.orderId,
        senderId: data.senderId,
        receiverId: data.receiverId,
        readAt: null,
        createdAt: new Date(),
      };
      records.push(message);
      return message;
    },
    async findMany({ orderId, userId, withUser, isAdmin }) {
      let result = records.filter((msg) => {
        if (orderId) {
          if (msg.orderId !== orderId) return false;
          return isAdmin || matchesParty(msg, userId);
        }
        if (msg.orderId !== null) return false;
        return matchesParty(msg, userId, withUser);
      });

      result = [...result].sort((a, b) => {
        if (orderId || withUser) {
          return a.createdAt.getTime() - b.createdAt.getTime();
        }
        return b.createdAt.getTime() - a.createdAt.getTime();
      });

      return result;
    },
    async countUnread(userId) {
      return records.filter((msg) => msg.receiverId === userId && msg.readAt === null).length;
    },
    async markRead({ userId, orderId, senderId }) {
      let marked = 0;
      for (const msg of records) {
        if (msg.receiverId !== userId || msg.readAt) continue;
        if (orderId) {
          if (msg.orderId !== orderId) continue;
        } else if (senderId) {
          if (msg.senderId !== senderId || msg.orderId !== null) continue;
        } else {
          continue;
        }
        msg.readAt = new Date();
        marked++;
      }
      return marked;
    },
  };
}
