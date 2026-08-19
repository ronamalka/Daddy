import { Request, Response, NextFunction } from "express";
import { AuthUser } from "./types";

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function extractUser(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers["x-user"] as string | undefined;
  if (header) {
    try {
      req.user = JSON.parse(header) as AuthUser;
    } catch {
      // invalid header, proceed without user
    }
  }
  next();
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== "ADMIN") {
    res.status(403).json({ error: "Admin access required" });
    return;
  }
  next();
}

export function requireSeller(req: Request, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== "SELLER") {
    res.status(403).json({ error: "Seller access required" });
    return;
  }
  next();
}
