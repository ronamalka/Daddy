import { Router, Request, Response } from "express";
import { randomBytes } from "crypto";
import { prisma } from "../db";
import { sendEmail } from "../../../shared/email";
import { verificationEmail } from "../../../shared/email-templates";

/** Routes for email verification. */
export const emailVerifyRoutes = Router();

const TOKEN_EXPIRY_HOURS = 24;
const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

/** Creates a verification token and sends the verification email. */
async function createAndSendVerification(userId: string, email: string, name: string) {
  // Invalidate any existing unused tokens
  await prisma.emailVerification.updateMany({
    where: { userId, usedAt: null },
    data: { usedAt: new Date() },
  });

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

  await prisma.emailVerification.create({
    data: { userId, token, expiresAt },
  });

  const link = `${BASE_URL}/verify-email?token=${token}`;
  await sendEmail(email, "אמת את כתובת האימייל שלך - אבאל׳ה", verificationEmail(name, link));
}

/** POST /email/send-verification -- resend the verification email (requires auth). */
emailVerifyRoutes.post("/send-verification", async (req: Request, res: Response) => {
  const userHeader = req.headers["x-user"];
  if (!userHeader) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  let user: { id: string; email: string; name: string };
  try {
    const decoded = decodeURIComponent(userHeader as string);
    user = JSON.parse(decoded);
  } catch {
    res.status(401).json({ error: "Invalid user header" });
    return;
  }

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!dbUser) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  if (dbUser.emailVerified) {
    res.json({ message: "Email already verified" });
    return;
  }

  try {
    await createAndSendVerification(dbUser.id, dbUser.email, dbUser.name);
    res.json({ message: "Verification email sent" });
  } catch (err) {
    console.error("[email-verify] Failed to send verification email:", err);
    res.status(500).json({ error: "Failed to send email" });
  }
});

/** GET /email/verify?token=xxx -- validates the token and marks the email as verified. */
emailVerifyRoutes.get("/verify", async (req: Request, res: Response) => {
  const { token } = req.query;

  if (!token || typeof token !== "string") {
    res.status(400).json({ error: "Token is required" });
    return;
  }

  const verification = await prisma.emailVerification.findUnique({ where: { token } });

  if (!verification || verification.usedAt || verification.expiresAt < new Date()) {
    res.status(400).json({ error: "Invalid or expired token" });
    return;
  }

  await prisma.emailVerification.update({
    where: { id: verification.id },
    data: { usedAt: new Date() },
  });

  await prisma.user.update({
    where: { id: verification.userId },
    data: { emailVerified: true },
  });

  res.json({ message: "Email verified successfully", verified: true });
});

export { createAndSendVerification };
