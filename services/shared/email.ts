import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const FROM = process.env.SMTP_FROM || "אבאל׳ה <noreply@aballeh.com>";

/** Sends an HTML email. Silently skips if SMTP is not configured. */
export async function sendEmail(to: string, subject: string, html: string) {
  if (!process.env.SMTP_USER) {
    console.warn("[email] SMTP not configured, skipping:", { to, subject });
    return;
  }
  await transporter.sendMail({ from: FROM, to, subject, html });
}
