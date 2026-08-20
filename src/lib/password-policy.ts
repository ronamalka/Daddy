import { z } from "zod";
import crypto from "crypto";

const MIN_LENGTH = 8;
const MAX_LENGTH = 128;

const COMMON_PASSWORDS = new Set([
  "12345678", "password", "123456789", "1234567890", "qwerty123",
  "abc12345", "password1", "iloveyou", "sunshine1", "princess1",
  "football1", "charlie1", "shadow12", "master12", "dragon12",
]);

export const passwordSchema = z
  .string()
  .min(MIN_LENGTH, { message: `הסיסמה חייבת להכיל לפחות ${MIN_LENGTH} תווים` })
  .max(MAX_LENGTH, { message: `הסיסמה יכולה להכיל עד ${MAX_LENGTH} תווים` })
  .refine((pw) => /[a-z]/.test(pw), { message: "חסרה אות קטנה באנגלית (a-z)" })
  .refine((pw) => /[A-Z]/.test(pw), { message: "חסרה אות גדולה באנגלית (A-Z)" })
  .refine((pw) => /[0-9]/.test(pw), { message: "חסרה ספרה (0-9)" })
  .refine((pw) => /[^a-zA-Z0-9]/.test(pw), { message: "חסר תו מיוחד (!@#$%^&*...)" })
  .refine((pw) => !COMMON_PASSWORDS.has(pw.toLowerCase()), {
    message: "הסיסמה נפוצה מדי, בחר סיסמה אחרת",
  });

export async function checkBreachedPassword(password: string): Promise<boolean> {
  try {
    const sha1 = crypto.createHash("sha1").update(password).digest("hex").toUpperCase();
    const prefix = sha1.slice(0, 5);
    const suffix = sha1.slice(5);

    const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: { "Add-Padding": "true" },
      signal: AbortSignal.timeout(3000),
    });

    if (!res.ok) return false;

    const text = await res.text();
    return text.split("\n").some((line) => {
      const [hash] = line.split(":");
      return hash.trim() === suffix;
    });
  } catch {
    return false;
  }
}
