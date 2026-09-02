import * as Sentry from "@sentry/node";
import type { Express } from "express";
import { logger } from "./logger";

/**
 * Initialize Sentry for an Express microservice.
 * Reads SENTRY_DSN from the environment; skips init when absent so local dev
 * works without a DSN.
 */
export function initSentry(): void {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) {
    logger.info("SENTRY_DSN not set — Sentry disabled");
    return;
  }

  const environment = process.env.NODE_ENV || "development";
  const serviceName = process.env.SERVICE_NAME || "unknown";

  Sentry.init({
    dsn,
    environment,
    serverName: serviceName,
    tracesSampleRate: environment === "production" ? 0.1 : 1.0,
    initialScope: {
      tags: { service: serviceName },
    },
  });

  logger.info({ service: serviceName, environment }, "Sentry initialized");
}

/**
 * Register the Sentry error handler on an Express app.
 * Must be called AFTER all routes are mounted.
 */
export function setupSentryErrorHandler(app: Express): void {
  if (!process.env.SENTRY_DSN) return;
  Sentry.setupExpressErrorHandler(app);
}

export { Sentry };
