process.env.SERVICE_NAME = process.env.SERVICE_NAME || "users";

import express from "express";
import { extractUser } from "../../shared/middleware";
import { metricsMiddleware, metricsHandler } from "../../shared/metrics";
import { prisma } from "./db";
import { applySecurity, authRateLimit, passwordResetRateLimit, otpSendRateLimit, generalRateLimit } from "../../shared/security";
import { logger, createRequestLogger } from "../../shared/logger";
import { initSentry, setupSentryErrorHandler } from "../../shared/sentry";
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
import { availabilityRoutes } from "./routes/availability";
import { loginRoutes } from "./routes/login";
import { oauthRoutes } from "./routes/oauth";
import { passwordResetRoutes } from "./routes/password-reset";
import { emailVerifyRoutes } from "./routes/email-verify";
import { notificationsRoutes } from "./routes/notifications";
import { verificationRoutes } from "./routes/verification";
import { addressesRoutes } from "./routes/addresses";
import { subscriptionRoutes } from "./routes/subscription";
import { commissionRoutes } from "./routes/commission";
import { whatsappRoutes } from "./routes/whatsapp";
import { userAnalyticsRoutes } from "./routes/analytics";
import { startCityCatalogRefresh } from "./city-catalog";

export { prisma };

initSentry();

const app = express();
const PORT = Number(process.env.PORT) || 4001;

applySecurity(app);
app.use(express.json({ limit: "1mb" }));
app.use(createRequestLogger());
app.use(extractUser);
app.use(generalRateLimit);
app.use(metricsMiddleware("users"));

/** Return a simple OK so other systems know the users service is running. */
app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "users" });
});

app.get("/metrics", metricsHandler());

app.use("/register", authRateLimit, registerRoutes);
app.use("/login", authRateLimit, loginRoutes);
app.use("/oauth", authRateLimit, oauthRoutes);
app.use("/password-reset", passwordResetRateLimit, passwordResetRoutes);
app.use("/email", authRateLimit, emailVerifyRoutes);
app.use("/profile", profileRoutes);
app.use("/admin", adminRoutes);
app.use("/providers", providersRoutes);
app.use("/sellers", sellerRoutes);
app.use("/sellers", commissionRoutes);
app.use("/service-areas", serviceAreasRoutes);
app.use("/service-prices", servicePricesRoutes);
app.use("/user-services", userServicesRoutes);
app.use("/locations", locationsRoutes);
app.use("/featured-daddies", featuredRoutes);
app.use("/availability", availabilityRoutes);
app.use("/notifications", notificationsRoutes);
app.use("/notifications/whatsapp", whatsappRoutes);
app.use("/verify", otpSendRateLimit, verificationRoutes);
app.use("/addresses", addressesRoutes);
app.use("/subscription", subscriptionRoutes);
app.use("/api/analytics", userAnalyticsRoutes);

setupSentryErrorHandler(app);

/** Start the users HTTP server. */
app.listen(PORT, "0.0.0.0", () => {
  logger.info({ port: PORT }, "Users service started");
  startCityCatalogRefresh();
});
