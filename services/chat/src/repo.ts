import { PrismaClient } from "./generated/prisma/client";
import { MessageRepo, MessageRecord, groupConversations } from "./chat";

/** Build a message store that reads and writes through the database. */
export function prismaMessageRepo(prisma: PrismaClient): MessageRepo {
  return {
    /** Save a new message and return it. */
    async create(data) {
      const message = await prisma.message.create({
        data: {
          content: data.content,
          senderId: data.senderId,
          receiverId: data.receiverId,
          orderId: data.orderId,
        },
      });
      return message as MessageRecord;
    },
    /** Find messages for an order, a direct chat, or all of this user's chats. */
    async findMany({ orderId, userId, withUser, isAdmin }) {
      if (orderId) {
        return prisma.message.findMany({
          where: {
            orderId,
            ...(isAdmin
              ? {}
              : {
                  OR: [{ senderId: userId }, { receiverId: userId }],
                }),
          },
          orderBy: { createdAt: "asc" },
        }) as Promise<MessageRecord[]>;
      }

      if (withUser) {
        return prisma.message.findMany({
          where: {
            OR: [
              { senderId: userId, receiverId: withUser },
              { senderId: withUser, receiverId: userId },
            ],
          },
          orderBy: { createdAt: "asc" },
        }) as Promise<MessageRecord[]>;
      }

      return prisma.message.findMany({
        where: {
          orderId: null,
          OR: [{ senderId: userId }, { receiverId: userId }],
        },
        orderBy: { createdAt: "desc" },
      }) as Promise<MessageRecord[]>;
    },
    /** Group this user's messages into conversation previews. */
    async listConversations(userId) {
      const messages = await prisma.message.findMany({
        where: {
          OR: [{ senderId: userId }, { receiverId: userId }],
        },
        orderBy: { createdAt: "asc" },
      });
      return groupConversations(userId, messages as MessageRecord[]);
    },
    /** Count unread messages for this user. */
    async countUnread(userId) {
      return prisma.message.count({
        where: { receiverId: userId, readAt: null },
      });
    },
    /** Mark matching unread messages as read and return how many changed. */
    async markRead({ userId, orderId, senderId }) {
      const where: Record<string, unknown> = {
        receiverId: userId,
        readAt: null,
      };
      if (orderId) {
        where.orderId = orderId;
      } else {
        where.senderId = senderId;
      }
      const { count } = await prisma.message.updateMany({
        where,
        data: { readAt: new Date() },
      });
      return count;
    },
  };
}
