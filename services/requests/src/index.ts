import express from "express";
import pg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client";
import { extractUser } from "../../shared/middleware";
import { applySecurity, generalRateLimit } from "../../shared/security";
import { serviceRequestsRoutes } from "./routes/service-requests";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
export const prisma = new PrismaClient({ adapter });
const app = express();
const PORT = Number(process.env.PORT) || 4004;

applySecurity(app);
app.use(express.json({ limit: "1mb" }));
app.use(extractUser);
app.use(generalRateLimit);

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "requests" });
});

app.use("/service-requests", serviceRequestsRoutes);

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Requests service running on port ${PORT}`);
});
