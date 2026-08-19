import express from "express";
import cors from "cors";
import pg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client";
import { extractUser } from "../../shared/middleware";
import { gigsRoutes } from "./routes/gigs";
import { gigDetailRoutes } from "./routes/gig-detail";
import { favoritesRoutes } from "./routes/favorites";
import { reviewsRoutes } from "./routes/reviews";
import { recentReviewsRoutes } from "./routes/recent-reviews";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
export const prisma = new PrismaClient({ adapter });
const app = express();
const PORT = Number(process.env.PORT) || 4002;

app.use(cors());
app.use(express.json());
app.use(extractUser);

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "gigs" });
});

app.use("/gigs", gigsRoutes);
app.use("/gigs", gigDetailRoutes);
app.use("/favorites", favoritesRoutes);
app.use("/reviews", reviewsRoutes);
app.use("/recent-reviews", recentReviewsRoutes);

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Gigs service running on port ${PORT}`);
});
