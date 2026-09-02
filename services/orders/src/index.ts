import express from "express";
import pg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client";
import { extractUser } from "../../shared/middleware";
import { applySecurity, generalRateLimit } from "../../shared/security";
import { ordersRoutes } from "./routes/orders";
import { orderDetailRoutes } from "./routes/order-detail";
import { disputeRoutes, adminDisputeRoutes } from "./routes/disputes";
import { materialsRoutes } from "./routes/materials";
import { paymentRoutes, paymentHistoryRoutes } from "./routes/payments";
import { invoiceRoutes } from "./routes/invoices";
import { maintenanceRoutes } from "./routes/maintenance";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
export const prisma = new PrismaClient({ adapter });
const app = express();
const PORT = Number(process.env.PORT) || 4003;

applySecurity(app);
app.use(express.json({ limit: "1mb" }));
app.use(extractUser);
app.use(generalRateLimit);

/** Return a simple OK so other systems know the orders service is running. */
app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "orders" });
});

app.use("/orders", ordersRoutes);
app.use("/orders", disputeRoutes);
app.use("/orders", materialsRoutes);
app.use("/orders", orderDetailRoutes);
app.use("/orders", paymentRoutes);
app.use("/payments", paymentHistoryRoutes);
app.use("/orders", invoiceRoutes);
app.use("/admin", adminDisputeRoutes);
app.use("/maintenance", maintenanceRoutes);

/** Start the orders HTTP server. */
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Orders service running on port ${PORT}`);
});
