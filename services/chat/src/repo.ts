import { PrismaClient } from "./generated/prisma/client";
import { MessageRepo, MessageRecord } from "./chat";

export function prismaMessageRepo(prisma: PrismaClient): MessageRepo {
  return {
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
            orderId: null,
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
    async countUnread(userId) {
      return prisma.message.count({
        where: { receiverId: userId, readAt: null },
      });
    },
    async markRead({ userId, orderId, senderId }) {
      const where: Record<string, unknown> = {
        receiverId: userId,
        readAt: null,
      };
      if (orderId) {
        where.orderId = orderId;
      } else {
        where.senderId = senderId;
        where.orderId = null;
      }
      const { count } = await prisma.message.updateMany({
        where,
        data: { readAt: new Date() },
      });
      return count;
    },
  };
}
