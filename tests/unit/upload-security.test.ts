import { describe, it, expect } from "vitest";
import {
  validateUpload,
  validateTotalSize,
  stripExifFromJpeg,
} from "../../src/lib/upload-security";

const JPEG_MAGIC = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]);
const PNG_MAGIC = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00]);
const WEBP_MAGIC = new Uint8Array([0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50]);
const GIF_MAGIC = new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61]);
const EXE_MAGIC = new Uint8Array([0x4d, 0x5a, 0x90, 0x00]);

describe("validateUpload", () => {
  it("accepts valid JPEG", () => {
    const result = validateUpload(
      { name: "photo.jpg", size: 1024, type: "image/jpeg" },
      JPEG_MAGIC
    );
    expect(result.valid).toBe(true);
    expect(result.sanitizedName).toMatch(/^[0-9a-f-]+\.jpg$/);
    expect(result.detectedType).toBe("image/jpeg");
  });

  it("accepts valid PNG", () => {
    const result = validateUpload(
      { name: "photo.png", size: 2048, type: "image/png" },
      PNG_MAGIC
    );
    expect(result.valid).toBe(true);
    expect(result.sanitizedName).toMatch(/^[0-9a-f-]+\.png$/);
    expect(result.detectedType).toBe("image/png");
  });

  it("accepts valid WebP", () => {
    const result = validateUpload(
      { name: "photo.webp", size: 512, type: "image/webp" },
      WEBP_MAGIC
    );
    expect(result.valid).toBe(true);
    expect(result.sanitizedName).toMatch(/^[0-9a-f-]+\.webp$/);
  });

  it("rejects files exceeding 5MB", () => {
    const result = validateUpload(
      { name: "huge.jpg", size: 6 * 1024 * 1024, type: "image/jpeg" },
      JPEG_MAGIC
    );
    expect(result.valid).toBe(false);
    expect(result.error).toContain("5MB");
  });

  it("rejects GIF (not in allowlist)", () => {
    const result = validateUpload(
      { name: "animation.gif", size: 1024, type: "image/gif" },
      GIF_MAGIC
    );
    expect(result.valid).toBe(false);
    expect(result.error).toContain("לא נתמך");
  });

  it("rejects disguised executable (fake extension)", () => {
    const result = validateUpload(
      { name: "virus.jpg", size: 1024, type: "image/jpeg" },
      EXE_MAGIC
    );
    expect(result.valid).toBe(false);
    expect(result.error).toContain("לא נתמך");
  });

  it("generates UUID filename regardless of original name", () => {
    const result = validateUpload(
      { name: "../../etc/passwd.jpg", size: 1024, type: "image/jpeg" },
      JPEG_MAGIC
    );
    expect(result.valid).toBe(true);
    expect(result.sanitizedName).not.toContain("..");
    expect(result.sanitizedName).not.toContain("passwd");
    expect(result.sanitizedName).toMatch(/^[0-9a-f-]+\.jpg$/);
  });

  it("detects MIME by magic bytes, ignoring claimed type", () => {
    const result = validateUpload(
      { name: "fake.png", size: 1024, type: "image/png" },
      JPEG_MAGIC
    );
    expect(result.valid).toBe(true);
    expect(result.detectedType).toBe("image/jpeg");
    expect(result.sanitizedName).toMatch(/\.jpg$/);
  });

  it("rejects empty/tiny files with no magic bytes", () => {
    const result = validateUpload(
      { name: "empty.jpg", size: 2, type: "image/jpeg" },
      new Uint8Array([0x00, 0x00])
    );
    expect(result.valid).toBe(false);
  });
});

describe("validateTotalSize", () => {
  it("allows files under 20MB total", () => {
    const result = validateTotalSize([
      { size: 5 * 1024 * 1024 },
      { size: 5 * 1024 * 1024 },
      { size: 5 * 1024 * 1024 },
    ]);
    expect(result).toBeNull();
  });

  it("rejects files exceeding 20MB total", () => {
    const result = validateTotalSize([
      { size: 5 * 1024 * 1024 },
      { size: 5 * 1024 * 1024 },
      { size: 5 * 1024 * 1024 },
      { size: 5 * 1024 * 1024 },
      { size: 1 },
    ]);
    expect(result).toContain("20MB");
  });
});

describe("stripExifFromJpeg", () => {
  it("preserves non-JPEG data unchanged", () => {
    const input = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);
    const result = stripExifFromJpeg(input);
    expect(result).toEqual(input);
  });

  it("strips APP1 (EXIF) markers from JPEG", () => {
    // Build a minimal JPEG with an APP1 (EXIF) segment followed by SOS
    const exifData = new Uint8Array([
      0xff, 0xd8,             // SOI
      0xff, 0xe0, 0x00, 0x04, 0x4a, 0x46,  // APP0 (JFIF) — 4 byte length
      0xff, 0xe1, 0x00, 0x06, 0x45, 0x78, 0x69, 0x66,  // APP1 (Exif) — 6 byte length with "Exif"
      0xff, 0xda, 0x00, 0x02,  // SOS marker with length
      0x12, 0x34,               // image data
    ]);

    const result = stripExifFromJpeg(exifData);

    // Should still start with SOI
    expect(result[0]).toBe(0xff);
    expect(result[1]).toBe(0xd8);

    // Should NOT contain APP1 marker (0xFF 0xE1)
    let hasExif = false;
    for (let i = 0; i < result.length - 1; i++) {
      if (result[i] === 0xff && result[i + 1] === 0xe1) {
        hasExif = true;
        break;
      }
    }
    expect(hasExif).toBe(false);
  });

  it("keeps APP0 (JFIF) marker", () => {
    const data = new Uint8Array([
      0xff, 0xd8,
      0xff, 0xe0, 0x00, 0x04, 0x4a, 0x46,
      0xff, 0xda, 0x00, 0x02,
      0xab, 0xcd,
    ]);

    const result = stripExifFromJpeg(data);

    let hasApp0 = false;
    for (let i = 0; i < result.length - 1; i++) {
      if (result[i] === 0xff && result[i + 1] === 0xe0) {
        hasApp0 = true;
        break;
      }
    }
    expect(hasApp0).toBe(true);
  });
});
