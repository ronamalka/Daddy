import { randomUUID } from "crypto";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB per file
const MAX_TOTAL_SIZE = 20 * 1024 * 1024; // 20MB per request

const ALLOWED_TYPES: Record<string, { extensions: string[]; magicBytes: number[][] }> = {
  "image/jpeg": {
    extensions: [".jpg", ".jpeg"],
    magicBytes: [[0xff, 0xd8, 0xff]],
  },
  "image/png": {
    extensions: [".png"],
    magicBytes: [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]],
  },
  "image/webp": {
    extensions: [".webp"],
    magicBytes: [[0x52, 0x49, 0x46, 0x46]],
  },
};

export interface UploadValidationResult {
  valid: boolean;
  error?: string;
  sanitizedName?: string;
  detectedType?: string;
}

/** Returns true if the file starts with the expected bytes. */
function checkMagicBytes(buffer: Uint8Array, expected: number[]): boolean {
  if (buffer.length < expected.length) return false;
  return expected.every((byte, i) => buffer[i] === byte);
}

/** Detects JPEG, PNG, or WebP from file bytes. Returns null if unknown. */
function detectMimeType(buffer: Uint8Array): string | null {
  for (const [mime, config] of Object.entries(ALLOWED_TYPES)) {
    for (const magic of config.magicBytes) {
      if (checkMagicBytes(buffer, magic)) {
        if (mime === "image/webp") {
          if (buffer.length >= 12) {
            const webpSig = [0x57, 0x45, 0x42, 0x50];
            if (webpSig.every((b, i) => buffer[8 + i] === b)) {
              return mime;
            }
          }
          continue;
        }
        return mime;
      }
    }
  }
  return null;
}

/** Removes EXIF and similar JPEG metadata. Returns the original buffer if this is not a JPEG. */
export function stripExifFromJpeg(buffer: Uint8Array): Uint8Array {
  if (buffer[0] !== 0xff || buffer[1] !== 0xd8) return buffer;

  const result: number[] = [0xff, 0xd8];
  let i = 2;

  while (i < buffer.length - 1) {
    if (buffer[i] !== 0xff) break;

    const marker = buffer[i + 1];

    // APP0-APP15 markers (0xE0-0xEF) and COM (0xFE) — skip these (contain EXIF, XMP, etc.)
    if ((marker >= 0xe1 && marker <= 0xef) || marker === 0xfe) {
      if (i + 3 >= buffer.length) break;
      const segLen = (buffer[i + 2] << 8) | buffer[i + 3];
      i += 2 + segLen;
      continue;
    }

    // SOS marker (0xDA) — start of scan, copy everything from here
    if (marker === 0xda) {
      for (let j = i; j < buffer.length; j++) {
        result.push(buffer[j]);
      }
      break;
    }

    // Keep other markers (DQT, DHT, SOF, APP0/JFIF, etc.)
    if (i + 3 >= buffer.length) break;
    const segLen = (buffer[i + 2] << 8) | buffer[i + 3];
    for (let j = 0; j < 2 + segLen; j++) {
      if (i + j < buffer.length) {
        result.push(buffer[i + j]);
      }
    }
    i += 2 + segLen;
  }

  return new Uint8Array(result);
}

/** Checks size and type, then returns a random file name and detected type. */
export function validateUpload(
  file: { name: string; size: number; type: string },
  buffer: Uint8Array
): UploadValidationResult {
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: `הקובץ גדול מדי. מקסימום ${MAX_FILE_SIZE / 1024 / 1024}MB` };
  }

  const detectedType = detectMimeType(buffer);
  if (!detectedType) {
    return { valid: false, error: "סוג הקובץ לא נתמך. ניתן להעלות JPEG, PNG או WebP בלבד." };
  }

  if (!ALLOWED_TYPES[detectedType]) {
    return { valid: false, error: "סוג הקובץ לא נתמך. ניתן להעלות JPEG, PNG או WebP בלבד." };
  }

  const ext = ALLOWED_TYPES[detectedType].extensions[0];
  const sanitizedName = `${randomUUID()}${ext}`;

  return { valid: true, sanitizedName, detectedType };
}

/** Returns an error string if all files together are too large, otherwise null. */
export function validateTotalSize(files: { size: number }[]): string | null {
  const total = files.reduce((sum, f) => sum + f.size, 0);
  if (total > MAX_TOTAL_SIZE) {
    return `סה"כ גודל הקבצים חורג מהמותר (${MAX_TOTAL_SIZE / 1024 / 1024}MB)`;
  }
  return null;
}

export { MAX_FILE_SIZE, MAX_TOTAL_SIZE, ALLOWED_TYPES };
