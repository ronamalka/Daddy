"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  Phone, IdentificationCard, Certificate, CheckCircle,
  Clock, XCircle, ArrowLeft, ShieldCheck, UploadSimple,
} from "@phosphor-icons/react";

interface VerificationStatus {
  phone: { hasPhone: boolean; verified: boolean; verifiedAt: string | null };
  identity: { status: string; hasPhoto: boolean; reviewedAt: string | null };
  license: { status: string; hasPhoto: boolean; type: string | null };
}

const STATUS_CONFIG: Record<string, { icon: React.ReactNode; label: string; color: string; bg: string }> = {
  NONE: {
    icon: <Clock className="h-5 w-5" />,
    label: "לא הוגש",
    color: "text-[rgb(var(--color-text-muted))]",
    bg: "bg-[rgb(var(--color-surface-elevated))]",
  },
  PENDING: {
    icon: <Clock className="h-5 w-5" />,
    label: "ממתין לבדיקה",
    color: "text-[rgb(var(--color-warning))]",
    bg: "bg-[rgba(var(--color-accent-yellow),0.1)]",
  },
  APPROVED: {
    icon: <CheckCircle className="h-5 w-5" weight="fill" />,
    label: "מאושר",
    color: "text-[rgb(var(--color-success))]",
    bg: "bg-[rgba(var(--color-success),0.1)]",
  },
  REJECTED: {
    icon: <XCircle className="h-5 w-5" weight="fill" />,
    label: "נדחה",
    color: "text-[rgb(var(--color-error))]",
    bg: "bg-[rgba(var(--color-error),0.1)]",
  },
};

/** Verification dashboard where users can verify phone, identity, and license. */
export default function VerificationPage() {
  const { data: session } = useSession();
  const [status, setStatus] = useState<VerificationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [otpSending, setOtpSending] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpChecking, setOtpChecking] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [identityUrl, setIdentityUrl] = useState("");
  const [identitySubmitting, setIdentitySubmitting] = useState(false);
  const [licenseUrl, setLicenseUrl] = useState("");
  const [licenseType, setLicenseType] = useState("");
  const [licenseSubmitting, setLicenseSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/verify/status");
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (session?.user) fetchStatus();
    else setLoading(false);
  }, [session, fetchStatus]);

  if (!session?.user) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <ShieldCheck className="h-10 w-10 text-[rgb(var(--color-text-muted))] mb-3" />
        <p className="text-[16px] text-[rgb(var(--color-text-secondary))]">התחבר כדי לנהל אימותים</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[rgba(var(--color-primary),0.1)] border-t-[rgb(var(--color-primary))]" />
      </div>
    );
  }

  async function sendOtp() {
    setOtpSending(true);
    setOtpError("");
    setMessage("");
    try {
      const res = await fetch("/api/verify/phone/send", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setOtpSent(true);
        setMessage("קוד אימות נשלח בהצלחה");
      } else {
        setOtpError(data?.error || "שגיאה בשליחת הקוד");
      }
    } catch {
      setOtpError("שגיאת רשת");
    } finally {
      setOtpSending(false);
    }
  }

  async function checkOtp() {
    if (otpCode.length !== 6) {
      setOtpError("יש להזין 6 ספרות");
      return;
    }
    setOtpChecking(true);
    setOtpError("");
    try {
      const res = await fetch("/api/verify/phone/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: otpCode }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage("הטלפון אומת בהצלחה!");
        setOtpSent(false);
        setOtpCode("");
        fetchStatus();
      } else {
        setOtpError(data?.error || "קוד שגוי");
      }
    } catch {
      setOtpError("שגיאת רשת");
    } finally {
      setOtpChecking(false);
    }
  }

  async function submitIdentity() {
    if (!identityUrl.trim()) return;
    setIdentitySubmitting(true);
    setMessage("");
    try {
      const res = await fetch("/api/verify/identity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoUrl: identityUrl }),
      });
      if (res.ok) {
        setMessage("תעודת הזהות הוגשה לבדיקה");
        setIdentityUrl("");
        fetchStatus();
      } else {
        const data = await res.json().catch(() => null);
        setMessage(data?.error || "שגיאה בהגשת תעודת הזהות");
      }
    } catch {
      setMessage("שגיאת רשת");
    } finally {
      setIdentitySubmitting(false);
    }
  }

  async function submitLicense() {
    if (!licenseUrl.trim() || !licenseType.trim()) return;
    setLicenseSubmitting(true);
    setMessage("");
    try {
      const res = await fetch("/api/verify/license", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoUrl: licenseUrl, licenseType }),
      });
      if (res.ok) {
        setMessage("הרישיון הוגש לבדיקה");
        setLicenseUrl("");
        setLicenseType("");
        fetchStatus();
      } else {
        const data = await res.json().catch(() => null);
        setMessage(data?.error || "שגיאה בהגשת הרישיון");
      }
    } catch {
      setMessage("שגיאת רשת");
    } finally {
      setLicenseSubmitting(false);
    }
  }

  const phoneStatus = status?.phone;
  const identityStatus = status?.identity;
  const licStatus = status?.license;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/profile" className="rounded-lg p-2 text-[rgb(var(--color-text-muted))] hover:bg-[rgb(var(--color-surface-elevated))] transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-[24px] font-bold text-[rgb(var(--color-text))]">אימותים</h1>
          <p className="text-[14px] text-[rgb(var(--color-text-secondary))]">אמת את הפרטים שלך כדי לבנות אמון</p>
        </div>
      </div>

      {message && (
        <div className="mb-4 rounded-xl bg-[rgba(var(--color-success),0.1)] px-4 py-3 text-[14px] font-medium text-[rgb(var(--color-success))] flex items-center gap-2">
          <CheckCircle className="h-5 w-5" weight="fill" />
          {message}
        </div>
      )}

      {/* Phone Verification */}
      <div className="mb-4 overflow-hidden rounded-2xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))]">
        <div className="flex items-center gap-3 border-b border-[rgb(var(--color-border-light))] px-6 py-4">
          <div className="rounded-xl bg-[rgba(var(--color-primary),0.1)] p-2.5">
            <Phone className="h-5 w-5 text-[rgb(var(--color-primary))]" />
          </div>
          <div className="flex-1">
            <h2 className="text-[16px] font-bold text-[rgb(var(--color-text))]">אימות טלפון</h2>
            <p className="text-[13px] text-[rgb(var(--color-text-muted))]">אמת את מספר הטלפון שלך באמצעות קוד חד פעמי</p>
          </div>
          {phoneStatus?.verified && (
            <span className="flex items-center gap-1 rounded-full bg-[rgba(var(--color-success),0.1)] px-3 py-1.5 text-[12px] font-semibold text-[rgb(var(--color-success))]">
              <CheckCircle className="h-3.5 w-3.5" weight="fill" />
              מאומת
            </span>
          )}
        </div>
        <div className="px-6 py-4">
          {phoneStatus?.verified ? (
            <p className="text-[14px] text-[rgb(var(--color-text-secondary))]">
              הטלפון אומת בהצלחה{phoneStatus.verifiedAt ? ` ב-${new Date(phoneStatus.verifiedAt).toLocaleDateString("he-IL")}` : ""}.
            </p>
          ) : !phoneStatus?.hasPhone ? (
            <div>
              <p className="text-[14px] text-[rgb(var(--color-text-secondary))] mb-3">
                יש להוסיף מספר טלפון בפרופיל לפני שניתן לאמת.
              </p>
              <Link
                href="/profile/edit"
                className="inline-flex items-center gap-2 rounded-xl bg-[rgb(var(--color-primary))] px-4 py-2.5 text-[14px] font-semibold text-white hover:bg-[rgb(var(--color-primary-hover))]"
              >
                עדכן פרופיל
              </Link>
            </div>
          ) : otpSent ? (
            <div className="space-y-3">
              <p className="text-[14px] text-[rgb(var(--color-text-secondary))]">הזן את הקוד שנשלח לטלפון שלך:</p>
              <div className="flex gap-3">
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="000000"
                  className="w-36 rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] px-4 py-2.5 text-center text-[18px] font-bold tracking-[0.3em] text-[rgb(var(--color-text))] placeholder-[rgb(var(--color-text-muted))] focus:border-[rgb(var(--color-primary))] focus:outline-none focus:ring-2 focus:ring-[rgba(var(--color-primary),0.2)]"
                />
                <button
                  onClick={checkOtp}
                  disabled={otpChecking || otpCode.length !== 6}
                  className="rounded-xl bg-[rgb(var(--color-primary))] px-5 py-2.5 text-[14px] font-semibold text-white hover:bg-[rgb(var(--color-primary-hover))] disabled:opacity-40"
                >
                  {otpChecking ? "בודק..." : "אמת"}
                </button>
              </div>
              <button
                onClick={sendOtp}
                disabled={otpSending}
                className="text-[13px] font-medium text-[rgb(var(--color-primary))] hover:underline"
              >
                שלח קוד מחדש
              </button>
              {otpError && <p className="text-[13px] text-[rgb(var(--color-error))]">{otpError}</p>}
            </div>
          ) : (
            <div>
              <button
                onClick={sendOtp}
                disabled={otpSending}
                className="inline-flex items-center gap-2 rounded-xl bg-[rgb(var(--color-primary))] px-5 py-2.5 text-[14px] font-semibold text-white hover:bg-[rgb(var(--color-primary-hover))] disabled:opacity-40"
              >
                {otpSending ? "שולח..." : "שלח קוד אימות"}
              </button>
              {otpError && <p className="mt-2 text-[13px] text-[rgb(var(--color-error))]">{otpError}</p>}
            </div>
          )}
        </div>
      </div>

      {/* Identity Verification */}
      <div className="mb-4 overflow-hidden rounded-2xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))]">
        <div className="flex items-center gap-3 border-b border-[rgb(var(--color-border-light))] px-6 py-4">
          <div className="rounded-xl bg-[rgba(var(--color-accent),0.1)] p-2.5">
            <IdentificationCard className="h-5 w-5 text-[rgb(var(--color-accent))]" />
          </div>
          <div className="flex-1">
            <h2 className="text-[16px] font-bold text-[rgb(var(--color-text))]">תעודת זהות</h2>
            <p className="text-[13px] text-[rgb(var(--color-text-muted))]">העלה תמונת ת.ז. לאימות זהות על ידי מנהל</p>
          </div>
          {identityStatus && identityStatus.status !== "NONE" && (
            (() => {
              const cfg = STATUS_CONFIG[identityStatus.status] || STATUS_CONFIG.NONE;
              return (
                <span className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-[12px] font-semibold ${cfg.bg} ${cfg.color}`}>
                  {cfg.icon}
                  {cfg.label}
                </span>
              );
            })()
          )}
        </div>
        <div className="px-6 py-4">
          {identityStatus?.status === "APPROVED" ? (
            <p className="text-[14px] text-[rgb(var(--color-text-secondary))]">
              תעודת הזהות אומתה בהצלחה{identityStatus.reviewedAt ? ` ב-${new Date(identityStatus.reviewedAt).toLocaleDateString("he-IL")}` : ""}.
            </p>
          ) : identityStatus?.status === "PENDING" ? (
            <p className="text-[14px] text-[rgb(var(--color-text-secondary))]">
              תעודת הזהות ממתינה לבדיקה על ידי מנהל. נעדכן אותך בהקדם.
            </p>
          ) : (
            <div className="space-y-3">
              {identityStatus?.status === "REJECTED" && (
                <p className="text-[14px] text-[rgb(var(--color-error))]">
                  הבקשה הקודמת נדחתה. ניתן להגיש מחדש.
                </p>
              )}
              <div className="flex gap-3">
                <input
                  type="url"
                  value={identityUrl}
                  onChange={(e) => setIdentityUrl(e.target.value)}
                  placeholder="הדבק קישור לתמונת ת.ז."
                  className="flex-1 rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] px-4 py-2.5 text-[14px] text-[rgb(var(--color-text))] placeholder-[rgb(var(--color-text-muted))] focus:border-[rgb(var(--color-primary))] focus:outline-none focus:ring-2 focus:ring-[rgba(var(--color-primary),0.2)]"
                />
                <button
                  onClick={submitIdentity}
                  disabled={identitySubmitting || !identityUrl.trim()}
                  className="flex items-center gap-2 rounded-xl bg-[rgb(var(--color-primary))] px-5 py-2.5 text-[14px] font-semibold text-white hover:bg-[rgb(var(--color-primary-hover))] disabled:opacity-40"
                >
                  <UploadSimple className="h-4 w-4" />
                  {identitySubmitting ? "שולח..." : "שלח"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* License Verification — only for sellers */}
      {session.user.role === "SELLER" && (
        <div className="mb-4 overflow-hidden rounded-2xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))]">
          <div className="flex items-center gap-3 border-b border-[rgb(var(--color-border-light))] px-6 py-4">
            <div className="rounded-xl bg-[rgba(var(--color-accent-yellow),0.15)] p-2.5">
              <Certificate className="h-5 w-5 text-[rgb(var(--color-warning))]" />
            </div>
            <div className="flex-1">
              <h2 className="text-[16px] font-bold text-[rgb(var(--color-text))]">רישיון מקצועי</h2>
              <p className="text-[13px] text-[rgb(var(--color-text-muted))]">נדרש לשירותים מפוקחים (חשמל, גז וכד׳)</p>
            </div>
            {licStatus && licStatus.status !== "NONE" && (
              (() => {
                const cfg = STATUS_CONFIG[licStatus.status] || STATUS_CONFIG.NONE;
                return (
                  <span className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-[12px] font-semibold ${cfg.bg} ${cfg.color}`}>
                    {cfg.icon}
                    {cfg.label}
                  </span>
                );
              })()
            )}
          </div>
          <div className="px-6 py-4">
            {licStatus?.status === "APPROVED" ? (
              <p className="text-[14px] text-[rgb(var(--color-text-secondary))]">
                הרישיון אומת בהצלחה{licStatus.type ? ` (${licStatus.type})` : ""}.
              </p>
            ) : licStatus?.status === "PENDING" ? (
              <p className="text-[14px] text-[rgb(var(--color-text-secondary))]">
                הרישיון ממתין לבדיקה{licStatus.type ? ` (${licStatus.type})` : ""}. נעדכן אותך בהקדם.
              </p>
            ) : (
              <div className="space-y-3">
                {licStatus?.status === "REJECTED" && (
                  <p className="text-[14px] text-[rgb(var(--color-error))]">
                    הבקשה הקודמת נדחתה. ניתן להגיש מחדש.
                  </p>
                )}
                <input
                  type="text"
                  value={licenseType}
                  onChange={(e) => setLicenseType(e.target.value)}
                  placeholder="סוג רישיון (לדוגמה: חשמלאי, מתקין גז)"
                  className="w-full rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] px-4 py-2.5 text-[14px] text-[rgb(var(--color-text))] placeholder-[rgb(var(--color-text-muted))] focus:border-[rgb(var(--color-primary))] focus:outline-none focus:ring-2 focus:ring-[rgba(var(--color-primary),0.2)]"
                />
                <div className="flex gap-3">
                  <input
                    type="url"
                    value={licenseUrl}
                    onChange={(e) => setLicenseUrl(e.target.value)}
                    placeholder="הדבק קישור לתמונת רישיון"
                    className="flex-1 rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] px-4 py-2.5 text-[14px] text-[rgb(var(--color-text))] placeholder-[rgb(var(--color-text-muted))] focus:border-[rgb(var(--color-primary))] focus:outline-none focus:ring-2 focus:ring-[rgba(var(--color-primary),0.2)]"
                  />
                  <button
                    onClick={submitLicense}
                    disabled={licenseSubmitting || !licenseUrl.trim() || !licenseType.trim()}
                    className="flex items-center gap-2 rounded-xl bg-[rgb(var(--color-primary))] px-5 py-2.5 text-[14px] font-semibold text-white hover:bg-[rgb(var(--color-primary-hover))] disabled:opacity-40"
                  >
                    <UploadSimple className="h-4 w-4" />
                    {licenseSubmitting ? "שולח..." : "שלח"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
