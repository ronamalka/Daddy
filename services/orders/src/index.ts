process.env.SERVICE_NAME = process.env.SERVICE_NAME || "orders";

import express from "express";
import pg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client";
import { extractUser } from "../../shared/middleware";
import { metricsMiddleware, metricsHandler } from "../../shared/metrics";
import { applySecurity, generalRateLimit } from "../../shared/security";
import { logger, createRequestLogger } from "../../shared/logger";
import { initSentry, setupSentryErrorHandler } from "../../shared/sentry";
import { ordersRoutes } from "./routes/orders";
import { orderDetailRoutes } from "./routes/order-detail";
import { disputeRoutes, adminDisputeRoutes } from "./routes/disputes";
import { materialsRoutes } from "./routes/materials";
import { paymentRoutes, paymentHistoryRoutes } from "./routes/payments";
import { invoiceRoutes } from "./routes/invoices";
import { maintenanceRoutes } from "./routes/maintenance";
import { warrantyRoutes, adminWarrantyRoutes } from "./routes/warranty";
import { analyticsRoutes } from "./routes/analytics";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
export const prisma = new PrismaClient({ adapter });

initSentry();

const app = express();
const PORT = Number(process.env.PORT) || 4003;

applySecurity(app);
app.use(express.json({ limit: "1mb" }));
app.use(createRequestLogger());
app.use(extractUser);
app.use(generalRateLimit);
app.use(metricsMiddleware("orders"));

/** Return a simple OK so other systems know the orders service is running. */
app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "orders" });
});

app.get("/metrics", metricsHandler());

app.use("/orders", ordersRoutes);
app.use("/orders", disputeRoutes);
app.use("/orders", materialsRoutes);
app.use("/orders", orderDetailRoutes);
app.use("/orders", paymentRoutes);
app.use("/payments", paymentHistoryRoutes);
app.use("/orders", invoiceRoutes);
app.use("/admin", adminDisputeRoutes);
app.use("/maintenance", maintenanceRoutes);
app.use("/orders", warrantyRoutes);
app.use("/admin", adminWarrantyRoutes);
app.use("/api/analytics", analyticsRoutes());

setupSentryErrorHandler(app);

/** Start the orders HTTP server. */
app.listen(PORT, "0.0.0.0", () => {
  logger.info({ port: PORT }, "Orders service started");
});
