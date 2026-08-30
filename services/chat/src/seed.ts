import pg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL || "postgresql://rmalka@localhost:5432/daddy_chat" });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.$connect();
  console.log("Chat seed complete (schema only).");
}

main()
  .catch(console.error)
  .finally(() => pool.end());
