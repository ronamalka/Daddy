import { describe, it, expect } from "vitest";
import { googleAuthErrorMessage } from "@/lib/oauth-errors";

describe("googleAuthErrorMessage", () => {
  it("explains a Google-only password login", () => {
    expect(googleAuthErrorMessage("CredentialsSignin", "google_account")).toMatch(/Google/);
  });

  it("explains denied consent", () => {
    expect(googleAuthErrorMessage("AccessDenied")).toMatch(/נדחתה/);
  });

  it("explains missing Google client config", () => {
    expect(googleAuthErrorMessage("Configuration")).toMatch(/לא מוגדרת/);
  });

  it("falls back for unknown codes", () => {
    expect(googleAuthErrorMessage("Nope")).toMatch(/נכשלה/);
  });
});
