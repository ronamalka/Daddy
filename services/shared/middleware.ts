import { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { AuthUser } from "./types";

if (!process.env.INTER_SERVICE_SECRET) {
  throw new Error("INTER_SERVICE_SECRET environment variable is required");
}
const INTER_SERVICE_SECRET = process.env.INTER_SERVICE_SECRET;

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

/** Return true if the signature matches this payload. */
function verifySignature(payload: string, signature: string): boolean {
  const expected = crypto.createHmac("sha256", INTER_SERVICE_SECRET).update(payload).digest("hex");
  if (expected.length !== signature.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

/** Check that the service-to-service HMAC token is present and valid. */
function hasValidServiceSignature(req: Request): boolean {
  const sig = req.headers["x-service-signature"] as string | undefined;
  if (!sig) return false;
  const expected = crypto.createHmac("sha256", INTER_SERVICE_SECRET).update("service-call").digest("hex");
  if (expected.length !== sig.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig));
}

/** Read the signed user header and attach the user to the request. */
export function extractUser(req: Request, res: Response, next: NextFunction) {
  const header = req.headers["x-user"] as string | undefined;
  const signature = req.headers["x-user-signature"] as string | undefined;

  if (header) {
    if (!signature) {
      res.status(403).json({ error: "Missing request signature" });
      return;
    }

    try {
      if (!verifySignature(header, signature)) {
        res.status(403).json({ error: "Invalid request signature" });
        return;
      }
      req.user = JSON.parse(decodeURIComponent(header)) as AuthUser;
    } catch {
      res.status(403).json({ error: "Invalid request signature" });
      return;
    }
  }
  next();
}

/** Stop the request if nobody is logged in. */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  next();
}

/** Stop the request unless the user is an admin. */
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== "ADMIN") {
    res.status(403).json({ error: "Admin access required" });
    return;
  }
  next();
}

/** Stop the request unless the user is a seller. */
export function requireSeller(req: Request, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== "SELLER") {
    res.status(403).json({ error: "Seller access required" });
    return;
  }
  next();
}

/** Stop the request unless it carries a valid inter-service signature (user or service-level). */
export function requireInternal(req: Request, res: Response, next: NextFunction) {
  if (req.user) {
    next();
    return;
  }
  if (hasValidServiceSignature(req)) {
    next();
    return;
  }
  res.status(403).json({ error: "Internal access required" });
}
