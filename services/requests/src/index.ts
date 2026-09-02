process.env.SERVICE_NAME = process.env.SERVICE_NAME || "requests";

import express from "express";
import pg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client";
import { extractUser } from "../../shared/middleware";
import { metricsMiddleware, metricsHandler } from "../../shared/metrics";
import { applySecurity, generalRateLimit } from "../../shared/security";
import { logger, createRequestLogger } from "../../shared/logger";
import { initSentry, setupSentryErrorHandler } from "../../shared/sentry";
import { serviceRequestsRoutes } from "./routes/service-requests";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
export const prisma = new PrismaClient({ adapter });

initSentry();

const app = express();
const PORT = Number(process.env.PORT) || 4004;

applySecurity(app);
app.use(express.json({ limit: "1mb" }));
app.use(createRequestLogger());
app.use(extractUser);
app.use(generalRateLimit);
app.use(metricsMiddleware("requests"));

/** Return a simple OK so other systems know the requests service is running. */
app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "requests" });
});

app.get("/metrics", metricsHandler());

app.use("/service-requests", serviceRequestsRoutes);

setupSentryErrorHandler(app);

/** Start the requests HTTP server. */
app.listen(PORT, "0.0.0.0", () => {
  logger.info({ port: PORT }, "Requests service started");
});
