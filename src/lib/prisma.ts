import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: InstanceType<typeof PrismaClient> };

function createPrismaClient() {
  const databaseUrl = process.env.DATABASE_URL!;

  const match = databaseUrl.match(/api_key=([A-Za-z0-9_-]+)/);
  if (match) {
    const decoded = JSON.parse(Buffer.from(match[1], "base64").toString());
    const adapter = new PrismaPg({ connectionString: decoded.databaseUrl });
    return new PrismaClient({ adapter });
  }

  const adapter = new PrismaPg({ connectionString: databaseUrl });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
