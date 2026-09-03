import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { Express } from "express";

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || "http://localhost:3000").split(",");

/** Turn on security headers and allow the known front-end origins. */
export function applySecurity(app: Express) {
  app.use(helmet());

  /** Set CORS headers and answer browser preflight OPTIONS requests. */
  app.use((_req, res, next) => {
    const origin = _req.headers.origin;
    if (origin && ALLOWED_ORIGINS.includes(origin)) {
      res.setHeader("Access-Control-Allow-Origin", origin);
    }
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type,x-user");
    if (_req.method === "OPTIONS") {
      res.sendStatus(204);
      return;
    }
    next();
  });
}

// Users service is ClusterIP-only; the BFF is the public choke point.
// Default must not be a cluster-wide cap of 20 — express-rate-limit keys
// by the BFF pod IP, so every login on the platform shares one bucket.
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: parseInt(process.env.AUTH_RATE_LIMIT_MAX || "200", 10),
  message: { error: "Too many attempts, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
});

export const passwordResetRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { error: "Too many reset attempts, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

/** Validate password meets strength requirements (matches frontend rules). */
export function validatePassword(password: string): string | null {
  if (password.length < 8) return "הסיסמה חייבת להכיל לפחות 8 תווים";
  if (!/[A-Z]/.test(password)) return "הסיסמה חייבת להכיל אות גדולה (A-Z)";
  if (!/[a-z]/.test(password)) return "הסיסמה חייבת להכיל אות קטנה (a-z)";
  if (!/[0-9]/.test(password)) return "הסיסמה חייבת להכיל ספרה (0-9)";
  if (!/[^a-zA-Z0-9]/.test(password)) return "הסיסמה חייבת להכיל תו מיוחד (!@#$...)";
  return null;
}

// ClusterIP services only see the BFF pod IP, and OpenShift probes hit
// /health every few seconds. A 300 cap is exhausted by probes alone, which
// then 429s seller gigs and chat DMs for every user on the platform.
export const generalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: parseInt(process.env.GENERAL_RATE_LIMIT_MAX || "2000", 10),
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
  /** Skip this limit for health checks so probes do not fill the bucket. */
  skip: (req) => req.path === "/health",
});
