import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: InstanceType<typeof PrismaClient> };

function createPrismaClient() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set");
  }

  const match = databaseUrl.match(/api_key=([A-Za-z0-9_-]+)/);
  if (match) {
    const decoded = JSON.parse(Buffer.from(match[1], "base64").toString());
    const adapter = new PrismaPg({ connectionString: decoded.databaseUrl });
    return new PrismaClient({ adapter });
  }

  const adapter = new PrismaPg({ connectionString: databaseUrl });
  return new PrismaClient({ adapter });
}

function getPrismaClient() {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
  }
  return globalForPrisma.prisma;
}

export const prisma = new Proxy({} as InstanceType<typeof PrismaClient>, {
  get(_target, prop) {
    return Reflect.get(getPrismaClient(), prop);
  },
});
