import { describe, it, expect, vi } from "vitest";
import crypto from "crypto";
import { extractUser } from "../../services/shared/middleware";
import type { Request, Response, NextFunction } from "express";

const SECRET = process.env.INTER_SERVICE_SECRET || "dev-secret-change-in-production";

function sign(payload: string) {
  return crypto.createHmac("sha256", SECRET).update(payload).digest("hex");
}

function mockRes() {
  const res = {
    status: vi.fn(),
    json: vi.fn(),
  };
  res.status.mockReturnValue(res);
  res.json.mockReturnValue(res);
  return res as unknown as Response & { status: ReturnType<typeof vi.fn>; json: ReturnType<typeof vi.fn> };
}

describe("extractUser x-user header", () => {
  it("parses percent-encoded Hebrew names", () => {
    const user = { id: "seed-user-seller1", email: "seller@daddy.com", name: "יוסי הגולדן", role: "SELLER" };
    const header = encodeURIComponent(JSON.stringify(user));
    const req = {
      headers: {
        "x-user": header,
        "x-user-signature": sign(header),
      },
    } as unknown as Request;
    const res = mockRes();
    const next = vi.fn() as NextFunction;

    extractUser(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(req.user).toEqual(user);
  });

  it("still accepts legacy ascii JSON headers", () => {
    const user = { id: "u1", email: "test@test.com", name: "Test", role: "BUYER" };
    const header = JSON.stringify(user);
    const req = {
      headers: {
        "x-user": header,
        "x-user-signature": sign(header),
      },
    } as unknown as Request;
    const res = mockRes();
    const next = vi.fn() as NextFunction;

    extractUser(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(req.user).toEqual(user);
  });
});
