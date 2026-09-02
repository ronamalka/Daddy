import express from "express";
import pg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client";
import { extractUser } from "../../shared/middleware";
import { applySecurity, generalRateLimit } from "../../shared/security";
import { createMessagesRouter } from "./routes/messages";
import { createViolationsRouter } from "./routes/violations";
import { prismaMessageRepo, prismaViolationRepo } from "./repo";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
export const prisma = new PrismaClient({ adapter });
const app = express();
const PORT = Number(process.env.PORT) || 4005;

applySecurity(app);
app.use(express.json({ limit: "1mb" }));
app.use(extractUser);
app.use(generalRateLimit);

/** Return a simple OK so other systems know the chat service is running. */
app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "chat" });
});

const violationRepo = prismaViolationRepo(prisma);
app.use("/messages", createMessagesRouter(prismaMessageRepo(prisma), violationRepo));
app.use("/violations", createViolationsRouter(prisma));

/** Start the chat HTTP server. */
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Chat service running on port ${PORT}`);
});
