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
  attachment?: string | null;
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

export type ConversationPreview = {
  otherUserId: string;
  lastMessage: MessageRecord;
  unreadCount: number;
};

const ATTACHMENT_PATH =
  /^\/uploads\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|jpeg|png|webp|pdf)$/i;

/** Accepts a same-origin /uploads/... path, or null if the field was omitted. */
export function parseAttachment(value: unknown): { ok: true; url: string | null } | { ok: false } {
  if (value === undefined || value === null || value === "") {
    return { ok: true, url: null };
  }
  if (typeof value !== "string" || value.length > 200 || !ATTACHMENT_PATH.test(value)) {
    return { ok: false };
  }
  return { ok: true, url: value };
}

export interface MessageRepo {
  create(data: {
    content: string;
    attachment: string | null;
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
  listConversations(userId: string): Promise<ConversationPreview[]>;
  countUnread(userId: string): Promise<number>;
  markRead(args: { userId: string; orderId?: string; senderId?: string }): Promise<number>;
}

/** Return the other person's id in this message. */
export function peerId(userId: string, message: Pick<MessageRecord, "senderId" | "receiverId">): string {
  return message.senderId === userId ? message.receiverId : message.senderId;
}

/** Group messages into one thread per other user, with the last message and unread count. */
export function groupConversations(userId: string, messages: MessageRecord[]): ConversationPreview[] {
  const byPeer = new Map<string, MessageRecord[]>();
  for (const message of messages) {
    const otherUserId = peerId(userId, message);
    const bucket = byPeer.get(otherUserId) || [];
    bucket.push(message);
    byPeer.set(otherUserId, bucket);
  }

  const conversations: ConversationPreview[] = [];
  for (const [otherUserId, thread] of byPeer) {
    const sorted = [...thread].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    conversations.push({
      otherUserId,
      lastMessage: sorted[sorted.length - 1],
      unreadCount: thread.filter((msg) => msg.receiverId === userId && msg.readAt === null).length,
    });
  }

  conversations.sort((a, b) => b.lastMessage.createdAt.getTime() - a.lastMessage.createdAt.getTime());
  return conversations;
}

export type ChatResult<T> =
  | { ok: true; status: number; data: T }
  | { ok: false; status: number; error: string };

/** Trim a message body, or return an empty string if it is not text. */
function trimContent(content: unknown): string {
  return typeof content === "string" ? content.trim() : "";
}

/** Create a message after checking the receiver, the text, and any upload path. */
export function sendMessage(repo: MessageRepo, input: SendMessageInput): Promise<ChatResult<MessageRecord>> {
  const content = trimContent(input.content);
  const { senderId, receiverId, orderId } = input;
  const attachment = parseAttachment(input.attachment);

  if (!attachment.ok) {
    return Promise.resolve({ ok: false, status: 400, error: "Invalid attachment" });
  }
  if (!receiverId) {
    return Promise.resolve({ ok: false, status: 400, error: "receiverId and content required" });
  }
  if (!content && !attachment.url) {
    return Promise.resolve({ ok: false, status: 400, error: "content or attachment required" });
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
    attachment: attachment.url,
    senderId,
    receiverId,
    orderId: orderId || null,
  }).then((data) => ({ ok: true as const, status: 201, data }));
}

/** Load messages for this user, optionally filtered by chat partner or order. */
export function listMessages(repo: MessageRepo, input: ListMessagesInput): Promise<ChatResult<MessageRecord[]>> {
  return repo.findMany({
    userId: input.userId,
    withUser: input.withUser,
    orderId: input.orderId,
    isAdmin: input.role === "ADMIN",
  }).then((data) => ({ ok: true as const, status: 200, data }));
}

/** Load this user's conversation list. */
export function listConversations(
  repo: MessageRepo,
  userId: string
): Promise<ChatResult<ConversationPreview[]>> {
  return repo.listConversations(userId).then((data) => ({ ok: true as const, status: 200, data }));
}

/** Count how many unread messages this user has. */
export function unreadCount(repo: MessageRepo, userId: string): Promise<ChatResult<{ count: number }>> {
  return repo.countUnread(userId).then((count) => ({ ok: true as const, status: 200, data: { count } }));
}

/** Mark messages as read for an order or a sender. */
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

/** Build an in-memory message store, mainly for tests. */
export function createInMemoryRepo(): MessageRepo & { records: MessageRecord[] } {
  const records: MessageRecord[] = [];
  let seq = 0;

  /** True if this message is between the user and an optional other person. */
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
    /** Save a new message and return it. */
    async create(data) {
      const message: MessageRecord = {
        id: `msg-${++seq}`,
        content: data.content,
        attachment: data.attachment ?? null,
        orderId: data.orderId,
        senderId: data.senderId,
        receiverId: data.receiverId,
        readAt: null,
        createdAt: new Date(),
      };
      records.push(message);
      return message;
    },
    /** Find messages for an order, a direct chat, or all of this user's chats. */
    async findMany({ orderId, userId, withUser, isAdmin }) {
      let result = records.filter((msg) => {
        if (orderId) {
          if (msg.orderId !== orderId) return false;
          return isAdmin || matchesParty(msg, userId);
        }
        if (withUser) {
          return matchesParty(msg, userId, withUser);
        }
        if (msg.orderId !== null) return false;
        return matchesParty(msg, userId);
      });

      result = [...result].sort((a, b) => {
        if (orderId || withUser) {
          return a.createdAt.getTime() - b.createdAt.getTime();
        }
        return b.createdAt.getTime() - a.createdAt.getTime();
      });

      return result;
    },
    /** Group this user's messages into conversation previews. */
    async listConversations(userId) {
      const mine = records.filter((msg) => msg.senderId === userId || msg.receiverId === userId);
      return groupConversations(userId, mine);
    },
    /** Count unread messages for this user. */
    async countUnread(userId) {
      return records.filter((msg) => msg.receiverId === userId && msg.readAt === null).length;
    },
    /** Mark matching unread messages as read and return how many changed. */
    async markRead({ userId, orderId, senderId }) {
      let marked = 0;
      for (const msg of records) {
        if (msg.receiverId !== userId || msg.readAt) continue;
        if (orderId) {
          if (msg.orderId !== orderId) continue;
        } else if (senderId) {
          if (msg.senderId !== senderId) continue;
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
