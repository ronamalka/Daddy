import express from "express";
import cors from "cors";
import pg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client";
import { extractUser } from "../../shared/middleware";
import { registerRoutes } from "./routes/register";
import { profileRoutes } from "./routes/profile";
import { adminRoutes } from "./routes/admin";
import { providersRoutes } from "./routes/providers";
import { sellerRoutes } from "./routes/sellers";
import { serviceAreasRoutes } from "./routes/service-areas";
import { servicePricesRoutes } from "./routes/service-prices";
import { userServicesRoutes } from "./routes/user-services";
import { locationsRoutes } from "./routes/locations";
import { featuredRoutes } from "./routes/featured";
import { loginRoutes } from "./routes/login";
import { oauthRoutes } from "./routes/oauth";
import { passwordResetRoutes } from "./routes/password-reset";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
export const prisma = new PrismaClient({ adapter });
const app = express();
const PORT = Number(process.env.PORT) || 4001;

app.use(cors());
app.use(express.json());
app.use(extractUser);

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "users" });
});

app.use("/register", registerRoutes);
app.use("/login", loginRoutes);
app.use("/oauth", oauthRoutes);
app.use("/password-reset", passwordResetRoutes);
app.use("/profile", profileRoutes);
app.use("/admin", adminRoutes);
app.use("/providers", providersRoutes);
app.use("/sellers", sellerRoutes);
app.use("/service-areas", serviceAreasRoutes);
app.use("/service-prices", servicePricesRoutes);
app.use("/user-services", userServicesRoutes);
app.use("/locations", locationsRoutes);
app.use("/featured-daddies", featuredRoutes);

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Users service running on port ${PORT}`);
});
