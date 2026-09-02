process.env.SERVICE_NAME = process.env.SERVICE_NAME || "gigs";

import express from "express";
import pg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client";
import { extractUser } from "../../shared/middleware";
import { metricsMiddleware, metricsHandler } from "../../shared/metrics";
import { applySecurity, generalRateLimit } from "../../shared/security";
import { logger, createRequestLogger } from "../../shared/logger";
import { initSentry, setupSentryErrorHandler } from "../../shared/sentry";
import { gigsRoutes } from "./routes/gigs";
import { gigDetailRoutes } from "./routes/gig-detail";
import { favoritesRoutes } from "./routes/favorites";
import { reviewsRoutes } from "./routes/reviews";
import { recentReviewsRoutes } from "./routes/recent-reviews";
import { favoriteSellerRoutes } from "./routes/favorite-sellers";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
export const prisma = new PrismaClient({ adapter });

initSentry();

const app = express();
const PORT = Number(process.env.PORT) || 4002;

applySecurity(app);
app.use(express.json({ limit: "1mb" }));
app.use(createRequestLogger());
app.use(extractUser);
app.use(generalRateLimit);
app.use(metricsMiddleware("gigs"));

/** Return a simple OK so other systems know the gigs service is running. */
app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "gigs" });
});

app.get("/metrics", metricsHandler());

app.use("/gigs", gigsRoutes);
app.use("/gigs", gigDetailRoutes);
app.use("/favorites", favoritesRoutes);
app.use("/reviews", reviewsRoutes);
app.use("/recent-reviews", recentReviewsRoutes);
app.use("/favorite-sellers", favoriteSellerRoutes);

setupSentryErrorHandler(app);

/** Start the gigs HTTP server. */
app.listen(PORT, "0.0.0.0", () => {
  logger.info({ port: PORT }, "Gigs service started");
});
