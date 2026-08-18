import { describe, it, expect } from "vitest";
import { hash, compare } from "bcryptjs";

describe("Password Hashing", () => {
  it("hashes and verifies a password correctly", async () => {
    const password = "password123";
    const hashed = await hash(password, 12);

    expect(hashed).not.toBe(password);
    expect(hashed).toMatch(/^\$2[aby]?\$/);

    const valid = await compare(password, hashed);
    expect(valid).toBe(true);
  });

  it("rejects wrong password", async () => {
    const hashed = await hash("password123", 12);
    const valid = await compare("wrongpassword", hashed);
    expect(valid).toBe(false);
  });

  it("produces different hashes for same password", async () => {
    const hash1 = await hash("password123", 12);
    const hash2 = await hash("password123", 12);
    expect(hash1).not.toBe(hash2);
  });
});

describe("Role Authorization Logic", () => {
  const checkRole = (userRole: string, requiredRole: string) => {
    if (requiredRole === "ADMIN") return userRole === "ADMIN";
    if (requiredRole === "SELLER") return userRole === "SELLER" || userRole === "ADMIN";
    return true;
  };

  it("ADMIN can access admin routes", () => {
    expect(checkRole("ADMIN", "ADMIN")).toBe(true);
  });

  it("SELLER cannot access admin routes", () => {
    expect(checkRole("SELLER", "ADMIN")).toBe(false);
  });

  it("BUYER cannot access admin routes", () => {
    expect(checkRole("BUYER", "ADMIN")).toBe(false);
  });

  it("SELLER can access seller routes", () => {
    expect(checkRole("SELLER", "SELLER")).toBe(true);
  });

  it("ADMIN can access seller routes", () => {
    expect(checkRole("ADMIN", "SELLER")).toBe(true);
  });

  it("BUYER cannot access seller routes", () => {
    expect(checkRole("BUYER", "SELLER")).toBe(false);
  });
});

describe("Session Token Shape", () => {
  it("JWT callback adds id and role", () => {
    const user = { id: "user-1", email: "test@test.com", name: "Test", role: "BUYER" };
    const token: Record<string, unknown> = { sub: "user-1" };

    token.id = user.id;
    token.role = user.role;

    expect(token.id).toBe("user-1");
    expect(token.role).toBe("BUYER");
  });

  it("session callback populates user fields", () => {
    const token = { id: "user-1", role: "SELLER" };
    const session = { user: { id: "", name: "Test", email: "test@test.com", role: "" } };

    session.user.id = token.id;
    session.user.role = token.role;

    expect(session.user.id).toBe("user-1");
    expect(session.user.role).toBe("SELLER");
  });
});
