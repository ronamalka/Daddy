import type { Express } from "express";
import { logger } from "./logger";

let Sentry: typeof import("@sentry/node") | null = null;

try {
  Sentry = require("@sentry/node");
} catch {
  logger.warn("@sentry/node not installed — Sentry will be disabled");
}

export function initSentry(): void {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn || !Sentry) {
    logger.info("Sentry disabled (no DSN or module not installed)");
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

export function setupSentryErrorHandler(app: Express): void {
  if (!process.env.SENTRY_DSN || !Sentry) return;
  Sentry.setupExpressErrorHandler(app);
}

export { Sentry };
