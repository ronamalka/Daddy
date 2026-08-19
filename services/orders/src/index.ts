import express from "express";
import cors from "cors";
import pg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client";
import { extractUser } from "../../shared/middleware";
import { ordersRoutes } from "./routes/orders";
import { orderDetailRoutes } from "./routes/order-detail";
import { messagesRoutes } from "./routes/messages";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
export const prisma = new PrismaClient({ adapter });
const app = express();
const PORT = Number(process.env.PORT) || 4003;

app.use(cors());
app.use(express.json());
app.use(extractUser);

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "orders" });
});

app.use("/orders", ordersRoutes);
app.use("/orders", orderDetailRoutes);
app.use("/messages", messagesRoutes);

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Orders service running on port ${PORT}`);
});
