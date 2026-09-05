import { describe, it, expect } from "vitest";
import { validatePhotoUrl, isSafePhotoUrl } from "../../services/shared/url-validation";

describe("validatePhotoUrl", () => {
  // --- Same-origin upload paths ---

  it("accepts a valid same-origin upload path", () => {
    const result = validatePhotoUrl("/uploads/550e8400-e29b-41d4-a716-446655440000.jpg");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.url).toContain("/uploads/");
  });

  it("accepts different image extensions for uploads", () => {
    expect(validatePhotoUrl("/uploads/550e8400-e29b-41d4-a716-446655440000.png").ok).toBe(true);
    expect(validatePhotoUrl("/uploads/550e8400-e29b-41d4-a716-446655440000.webp").ok).toBe(true);
    expect(validatePhotoUrl("/uploads/550e8400-e29b-41d4-a716-446655440000.jpeg").ok).toBe(true);
  });

  // --- HTTPS from allowed hosts ---

  it("accepts HTTPS URL from allowed domain (aballeh.com)", () => {
    const result = validatePhotoUrl("https://aballeh.com/uploads/photo.jpg");
    expect(result.ok).toBe(true);
  });

  it("accepts HTTPS URL from www subdomain", () => {
    const result = validatePhotoUrl("https://www.aballeh.com/uploads/photo.jpg");
    expect(result.ok).toBe(true);
  });

  // --- Protocol enforcement ---

  it("rejects HTTP URLs (not HTTPS)", () => {
    const result = validatePhotoUrl("http://aballeh.com/uploads/photo.jpg");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("HTTPS");
  });

  it("rejects ftp: URLs", () => {
    const result = validatePhotoUrl("ftp://aballeh.com/photo.jpg");
    expect(result.ok).toBe(false);
  });

  it("rejects javascript: URLs", () => {
    const result = validatePhotoUrl("javascript:alert(1)");
    expect(result.ok).toBe(false);
  });

  it("rejects data: URLs", () => {
    const result = validatePhotoUrl("data:image/jpeg;base64,/9j/4AAQ");
    expect(result.ok).toBe(false);
  });

  it("rejects file: URLs", () => {
    const result = validatePhotoUrl("file:///etc/passwd");
    expect(result.ok).toBe(false);
  });

  // --- Private IP blocking (SSRF) ---

  it("rejects loopback IPs (127.x.x.x)", () => {
    expect(validatePhotoUrl("https://127.0.0.1/photo.jpg").ok).toBe(false);
    expect(validatePhotoUrl("https://127.0.0.2/photo.jpg").ok).toBe(false);
    expect(validatePhotoUrl("https://127.255.255.255/photo.jpg").ok).toBe(false);
  });

  it("rejects 10.x.x.x private IPs", () => {
    expect(validatePhotoUrl("https://10.0.0.1/photo.jpg").ok).toBe(false);
    expect(validatePhotoUrl("https://10.255.255.255/photo.jpg").ok).toBe(false);
  });

  it("rejects 172.16-31.x.x private IPs", () => {
    expect(validatePhotoUrl("https://172.16.0.1/photo.jpg").ok).toBe(false);
    expect(validatePhotoUrl("https://172.31.255.255/photo.jpg").ok).toBe(false);
  });

  it("rejects 192.168.x.x private IPs", () => {
    expect(validatePhotoUrl("https://192.168.0.1/photo.jpg").ok).toBe(false);
    expect(validatePhotoUrl("https://192.168.1.100/photo.jpg").ok).toBe(false);
  });

  it("rejects 0.x.x.x IPs", () => {
    expect(validatePhotoUrl("https://0.0.0.0/photo.jpg").ok).toBe(false);
  });

  it("rejects link-local IPs (169.254.x.x)", () => {
    expect(validatePhotoUrl("https://169.254.1.1/photo.jpg").ok).toBe(false);
  });

  it("rejects AWS metadata endpoint (169.254.169.254)", () => {
    expect(validatePhotoUrl("https://169.254.169.254/latest/meta-data/").ok).toBe(false);
  });

  it("rejects CGN range (100.64-127.x.x)", () => {
    expect(validatePhotoUrl("https://100.64.0.1/photo.jpg").ok).toBe(false);
    expect(validatePhotoUrl("https://100.127.255.255/photo.jpg").ok).toBe(false);
  });

  // --- Blocked hostnames ---

  it("rejects localhost", () => {
    expect(validatePhotoUrl("https://localhost/photo.jpg").ok).toBe(false);
  });

  it("rejects metadata.google.internal", () => {
    expect(validatePhotoUrl("https://metadata.google.internal/computeMetadata/v1/").ok).toBe(false);
  });

  // --- IPv6 blocking ---

  it("rejects IPv6 addresses", () => {
    expect(validatePhotoUrl("https://[::1]/photo.jpg").ok).toBe(false);
    expect(validatePhotoUrl("https://[fd00::1]/photo.jpg").ok).toBe(false);
  });

  // --- Unknown hosts ---

  it("rejects URLs from unknown domains", () => {
    const result = validatePhotoUrl("https://evil.example.com/photo.jpg");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("מורשים");
  });

  // --- Edge cases ---

  it("rejects empty string", () => {
    expect(validatePhotoUrl("").ok).toBe(false);
  });

  it("rejects null/undefined", () => {
    expect(validatePhotoUrl(null).ok).toBe(false);
    expect(validatePhotoUrl(undefined).ok).toBe(false);
  });

  it("rejects non-string types", () => {
    expect(validatePhotoUrl(123).ok).toBe(false);
    expect(validatePhotoUrl({}).ok).toBe(false);
  });

  it("rejects whitespace-only string", () => {
    expect(validatePhotoUrl("   ").ok).toBe(false);
  });

  it("rejects malformed URLs", () => {
    expect(validatePhotoUrl("not-a-url").ok).toBe(false);
    expect(validatePhotoUrl("://missing-scheme").ok).toBe(false);
  });
});

describe("isSafePhotoUrl", () => {
  it("returns true for valid upload path", () => {
    expect(isSafePhotoUrl("/uploads/550e8400-e29b-41d4-a716-446655440000.jpg")).toBe(true);
  });

  it("returns true for HTTPS from allowed host", () => {
    expect(isSafePhotoUrl("https://aballeh.com/photo.jpg")).toBe(true);
  });

  it("returns false for private IP", () => {
    expect(isSafePhotoUrl("https://192.168.1.1/photo.jpg")).toBe(false);
  });

  it("returns false for non-string input", () => {
    expect(isSafePhotoUrl(42)).toBe(false);
    expect(isSafePhotoUrl(null)).toBe(false);
  });
});
