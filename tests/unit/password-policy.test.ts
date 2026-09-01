import { describe, it, expect } from "vitest";
import { isPasswordWeak } from "@/lib/password-policy";

describe("isPasswordWeak", () => {
  it("flags the seeded demo password as weak", () => {
    expect(isPasswordWeak("password123")).toBe(true);
  });

  it("accepts a password that meets the policy", () => {
    expect(isPasswordWeak("Buyer@1234!")).toBe(false);
  });

  it("rejects passwords missing a special character", () => {
    expect(isPasswordWeak("Password1")).toBe(true);
  });

  it("rejects passwords shorter than 8 characters", () => {
    expect(isPasswordWeak("Ab1!")).toBe(true);
  });
});
