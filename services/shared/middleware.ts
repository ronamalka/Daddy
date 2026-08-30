import { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { AuthUser } from "./types";

const INTER_SERVICE_SECRET = process.env.INTER_SERVICE_SECRET || "dev-secret-change-in-production";

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
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
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
