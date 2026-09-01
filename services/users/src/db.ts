import pg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);

/** Shared Prisma client for the users service. Kept out of index.ts so catalog code can import it without starting HTTP. */
export const prisma = new PrismaClient({ adapter });
export { pool };
