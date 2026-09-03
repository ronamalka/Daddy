import { Router, Request, Response } from "express";
import { randomBytes } from "crypto";
import { hash } from "bcryptjs";
import { prisma } from "../db";
import { sendEmail } from "../../../shared/email";
import { passwordResetEmail } from "../../../shared/email-templates";
import { logger } from "../../../shared/logger";
import { validatePassword } from "../../../shared/security";

/** Routes for requesting, checking, and using a password-reset token. */
export const passwordResetRoutes = Router();

const TOKEN_EXPIRY_HOURS = 1;
const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

/** Create a reset token for this email, without saying if the account exists. */
passwordResetRoutes.post("/request", async (req: Request, res: Response) => {
  const { email } = req.body;

  if (!email) {
    res.status(400).json({ error: "Email is required" });
    return;
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    res.json({ message: "If the email exists, a reset link has been sent" });
    return;
  }

  if (!user.passwordHash) {
    res.json({ message: "If the email exists, a reset link has been sent" });
    return;
  }

  await prisma.passwordReset.updateMany({
    where: { userId: user.id, usedAt: null },
    data: { usedAt: new Date() },
  });

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

  await prisma.passwordReset.create({
    data: {
      userId: user.id,
      token,
      expiresAt,
    },
  });

  // Send the reset email (non-blocking for anti-enumeration: always respond the same)
  const link = `${BASE_URL}/reset-password?token=${token}`;
  sendEmail(user.email, "איפוס סיסמה - אבאל׳ה", passwordResetEmail(user.name, link)).catch((err) => {
    logger.error({ err }, "Failed to send password reset email");
  });

  res.json({ message: "If the email exists, a reset link has been sent" });
});

/** Check that a reset token is still valid. */
passwordResetRoutes.post("/validate", async (req: Request, res: Response) => {
  const { token } = req.body;

  if (!token) {
    res.status(400).json({ error: "Token is required" });
    return;
  }

  const reset = await prisma.passwordReset.findUnique({ where: { token } });

  if (!reset || reset.usedAt || reset.expiresAt < new Date()) {
    res.status(400).json({ error: "Invalid or expired token" });
    return;
  }

  res.json({ valid: true });
});

/** Set a new password using a valid reset token. */
passwordResetRoutes.post("/reset", async (req: Request, res: Response) => {
  const { token, password } = req.body;

  if (!token || !password) {
    res.status(400).json({ error: "Token and password are required" });
    return;
  }

  const passwordError = validatePassword(password);
  if (passwordError) {
    res.status(400).json({ error: passwordError });
    return;
  }

  const reset = await prisma.passwordReset.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!reset || reset.usedAt || reset.expiresAt < new Date()) {
    res.status(400).json({ error: "Invalid or expired token" });
    return;
  }

  const passwordHash = await hash(password, 12);

  await prisma.user.update({
    where: { id: reset.userId },
    data: { passwordHash },
  });

  await prisma.passwordReset.update({
    where: { id: reset.id },
    data: { usedAt: new Date() },
  });

  res.json({ message: "Password has been reset successfully", userId: reset.userId });
});
