import { Router, Request, Response } from "express";
import { requireAuth } from "../../../shared/middleware";
import { prisma } from "../index";
import crypto from "crypto";
import { logger } from "../../../shared/logger";
import { validatePhotoUrl } from "../../../shared/url-validation";

/** Verification routes: phone OTP, identity upload, and license upload. */
export const verificationRoutes = Router();

const OTP_EXPIRY_MINUTES = 10;
const MAX_OTP_ATTEMPTS = 3;

/** Generate a 6-digit OTP code. */
function generateOtp(): string {
  return crypto.randomInt(100000, 999999).toString();
}

/** POST /verify/phone/send — Generate and store a 6-digit OTP for the user's phone. */
verificationRoutes.post("/phone/send", requireAuth, async (req: Request, res: Response) => {
  const userId = req.user!.id;

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { phone: true, phoneVerified: true } });
  if (!user) {
    res.status(404).json({ error: "המשתמש לא נמצא" });
    return;
  }
  if (!user.phone) {
    res.status(400).json({ error: "יש להוסיף מספר טלפון בפרופיל לפני אימות" });
    return;
  }
  if (user.phoneVerified) {
    res.status(400).json({ error: "הטלפון כבר מאומת" });
    return;
  }

  const code = generateOtp();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  await prisma.phoneOtp.create({
    data: {
      userId,
      phone: user.phone,
      code,
      expiresAt,
    },
  });

  // TODO(launch): Integrate real SMS provider (Twilio / Vonage) — issue #52
  logger.info({ phone: user.phone }, "OTP code generated");

  res.json({ sent: true, phone: user.phone.replace(/.(?=.{4})/g, "*") });
});

/** POST /verify/phone/check — Validate the OTP code and mark phone as verified. */
verificationRoutes.post("/phone/check", requireAuth, async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { code } = req.body as { code?: string };

  if (!code || code.length !== 6) {
    res.status(400).json({ error: "קוד אימות חייב להיות 6 ספרות" });
    return;
  }

  const otp = await prisma.phoneOtp.findFirst({
    where: {
      userId,
      usedAt: null,
    },
    orderBy: { createdAt: "desc" },
  });

  if (!otp) {
    res.status(400).json({ error: "לא נמצא קוד אימות. שלח קוד חדש" });
    return;
  }

  if (otp.attempts >= MAX_OTP_ATTEMPTS) {
    res.status(400).json({ error: "חרגת ממספר הניסיונות. שלח קוד חדש" });
    return;
  }

  if (new Date() > otp.expiresAt) {
    res.status(400).json({ error: "הקוד פג תוקף. שלח קוד חדש" });
    return;
  }

  const codeMatch = otp.code.length === code.length &&
    crypto.timingSafeEqual(Buffer.from(otp.code), Buffer.from(code));
  if (!codeMatch) {
    await prisma.phoneOtp.update({
      where: { id: otp.id },
      data: { attempts: otp.attempts + 1 },
    });
    const remaining = MAX_OTP_ATTEMPTS - otp.attempts - 1;
    res.status(400).json({ error: `קוד שגוי. נותרו ${remaining} ניסיונות` });
    return;
  }

  // Mark OTP as used and user's phone as verified
  await prisma.$transaction([
    prisma.phoneOtp.update({
      where: { id: otp.id },
      data: { usedAt: new Date() },
    }),
    prisma.user.update({
      where: { id: userId },
      data: { phoneVerified: true, phoneVerifiedAt: new Date() },
    }),
  ]);

  res.json({ verified: true });
});

/** POST /verify/identity/upload — Submit an ID photo for admin review. */
verificationRoutes.post("/identity/upload", requireAuth, async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { photoUrl } = req.body as { photoUrl?: string };

  if (!photoUrl || typeof photoUrl !== "string") {
    res.status(400).json({ error: "יש לצרף קישור לתמונת תעודת זהות" });
    return;
  }

  const urlCheck = validatePhotoUrl(photoUrl);
  if (!urlCheck.ok) {
    res.status(400).json({ error: urlCheck.error });
    return;
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      identityPhoto: urlCheck.url,
      identityStatus: "PENDING",
      identityReviewedAt: null,
      identityReviewedBy: null,
    },
  });

  res.json({ status: "PENDING" });
});

/** POST /verify/license/upload — Submit a license photo for admin review. */
verificationRoutes.post("/license/upload", requireAuth, async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { photoUrl, licenseType } = req.body as { photoUrl?: string; licenseType?: string };

  if (!photoUrl || typeof photoUrl !== "string") {
    res.status(400).json({ error: "יש לצרף קישור לתמונת רישיון" });
    return;
  }
  if (!licenseType || typeof licenseType !== "string") {
    res.status(400).json({ error: "יש לציין סוג רישיון" });
    return;
  }

  const urlCheck = validatePhotoUrl(photoUrl);
  if (!urlCheck.ok) {
    res.status(400).json({ error: urlCheck.error });
    return;
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      licensePhoto: urlCheck.url,
      licenseType,
      licenseStatus: "PENDING",
    },
  });

  res.json({ status: "PENDING" });
});

/** GET /verify/status — Return the current verification status for the logged-in user. */
verificationRoutes.get("/status", requireAuth, async (req: Request, res: Response) => {
  const userId = req.user!.id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      phone: true,
      phoneVerified: true,
      phoneVerifiedAt: true,
      identityStatus: true,
      identityPhoto: true,
      identityReviewedAt: true,
      licenseStatus: true,
      licensePhoto: true,
      licenseType: true,
    },
  });

  if (!user) {
    res.status(404).json({ error: "המשתמש לא נמצא" });
    return;
  }

  res.json({
    phone: {
      hasPhone: Boolean(user.phone),
      verified: user.phoneVerified,
      verifiedAt: user.phoneVerifiedAt,
    },
    identity: {
      status: user.identityStatus,
      hasPhoto: Boolean(user.identityPhoto),
      reviewedAt: user.identityReviewedAt,
    },
    license: {
      status: user.licenseStatus || "NONE",
      hasPhoto: Boolean(user.licensePhoto),
      type: user.licenseType,
    },
  });
});
