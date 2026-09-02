"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import {
  ShieldCheck, Prohibit, IdentificationCard, Certificate,
  CheckCircle, XCircle, ArrowLeft, Eye,
} from "@phosphor-icons/react";

interface PendingUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  identityStatus: string;
  identityPhoto: string | null;
  licenseStatus: string;
  licensePhoto: string | null;
  licenseType: string | null;
  createdAt: string;
}

/** Admin page for reviewing pending identity and license verifications. */
export default function AdminVerificationsPage() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user?.role !== "ADMIN") return;
    fetch("/api/admin/verifications")
      .then((r) => r.json())
      .then((data) => {
        setUsers(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [session]);

  if (!session || session.user.role !== "ADMIN") {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="rounded-full bg-[rgba(var(--color-error),0.1)] p-4 mb-4">
          <Prohibit className="h-8 w-8 text-[rgb(var(--color-error))]" />
        </div>
        <p className="text-[16px] font-medium text-[rgb(var(--color-text))]">הגישה נדחתה</p>
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

  async function handleReview(userId: string, type: "identity" | "license", decision: "APPROVED" | "REJECTED") {
    setReviewing(`${userId}-${type}`);
    try {
      const res = await fetch(`/api/admin/verifications/${userId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, decision }),
      });
      if (res.ok) {
        // Refresh list
        const refreshed = await fetch("/api/admin/verifications").then((r) => r.json());
        setUsers(Array.isArray(refreshed) ? refreshed : []);
      }
    } catch {
      // ignore
    } finally {
      setReviewing(null);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/admin" className="rounded-lg p-2 text-[rgb(var(--color-text-muted))] hover:bg-[rgb(var(--color-surface-elevated))] transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-[24px] font-bold text-[rgb(var(--color-text))]">בדיקת אימותים</h1>
          <p className="text-[14px] text-[rgb(var(--color-text-secondary))]">אשר או דחה בקשות אימות זהות ורישיון</p>
        </div>
        <span className="ms-auto rounded-full bg-[rgba(var(--color-primary),0.1)] px-3 py-1 text-[13px] font-semibold text-[rgb(var(--color-primary))]">
          {users.length} ממתינים
        </span>
      </div>

      {/* Photo Preview Modal */}
      {previewUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setPreviewUrl(null)}
        >
          <div className="relative max-h-[80vh] max-w-[90vw] overflow-hidden rounded-2xl bg-[rgb(var(--color-surface))]" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setPreviewUrl(null)}
              className="absolute top-3 end-3 rounded-full bg-black/50 p-2 text-white hover:bg-black/70"
            >
              <XCircle className="h-5 w-5" />
            </button>
            <Image src={previewUrl} alt="תצוגה מקדימה" width={800} height={600} className="max-h-[80vh] w-auto object-contain" unoptimized />
          </div>
        </div>
      )}

      {users.length === 0 ? (
        <div className="rounded-2xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] p-12 text-center">
          <ShieldCheck className="mx-auto mb-3 h-10 w-10 text-[rgb(var(--color-text-muted))]" />
          <p className="text-[16px] font-medium text-[rgb(var(--color-text))]">אין בקשות ממתינות</p>
          <p className="mt-1 text-[14px] text-[rgb(var(--color-text-muted))]">כל האימותים נבדקו</p>
        </div>
      ) : (
        <div className="space-y-4">
          {users.map((user) => (
            <div
              key={user.id}
              className="overflow-hidden rounded-2xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))]"
            >
              <div className="flex items-center gap-4 border-b border-[rgb(var(--color-border-light))] px-6 py-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-[14px] font-bold text-white">
                  {user.name[0]}
                </div>
                <div className="flex-1">
                  <p className="text-[14px] font-semibold text-[rgb(var(--color-text))]">{user.name}</p>
                  <p className="text-[12px] text-[rgb(var(--color-text-muted))]">{user.email}{user.phone ? ` | ${user.phone}` : ""}</p>
                </div>
                <p className="text-[12px] text-[rgb(var(--color-text-muted))]">
                  הצטרף {new Date(user.createdAt).toLocaleDateString("he-IL")}
                </p>
              </div>

              <div className="divide-y divide-[rgb(var(--color-border-light))]">
                {/* Identity Review */}
                {user.identityStatus === "PENDING" && (
                  <div className="flex items-center gap-4 px-6 py-4">
                    <IdentificationCard className="h-5 w-5 text-[rgb(var(--color-accent))]" />
                    <span className="text-[14px] font-medium text-[rgb(var(--color-text))]">תעודת זהות</span>
                    <div className="flex-1" />
                    {user.identityPhoto && (
                      <button
                        onClick={() => setPreviewUrl(user.identityPhoto)}
                        className="flex items-center gap-1.5 rounded-lg border border-[rgb(var(--color-border))] px-3 py-1.5 text-[12px] font-medium text-[rgb(var(--color-text-secondary))] hover:border-[rgb(var(--color-primary))] hover:text-[rgb(var(--color-primary))]"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        צפה
                      </button>
                    )}
                    <button
                      onClick={() => handleReview(user.id, "identity", "APPROVED")}
                      disabled={reviewing === `${user.id}-identity`}
                      className="flex items-center gap-1.5 rounded-lg bg-[rgba(var(--color-success),0.1)] px-3 py-1.5 text-[12px] font-semibold text-[rgb(var(--color-success))] hover:bg-[rgba(var(--color-success),0.2)] disabled:opacity-40"
                    >
                      <CheckCircle className="h-3.5 w-3.5" />
                      אשר
                    </button>
                    <button
                      onClick={() => handleReview(user.id, "identity", "REJECTED")}
                      disabled={reviewing === `${user.id}-identity`}
                      className="flex items-center gap-1.5 rounded-lg bg-[rgba(var(--color-error),0.1)] px-3 py-1.5 text-[12px] font-semibold text-[rgb(var(--color-error))] hover:bg-[rgba(var(--color-error),0.2)] disabled:opacity-40"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      דחה
                    </button>
                  </div>
                )}

                {/* License Review */}
                {user.licenseStatus === "PENDING" && (
                  <div className="flex items-center gap-4 px-6 py-4">
                    <Certificate className="h-5 w-5 text-[rgb(var(--color-warning))]" />
                    <span className="text-[14px] font-medium text-[rgb(var(--color-text))]">
                      רישיון{user.licenseType ? ` (${user.licenseType})` : ""}
                    </span>
                    <div className="flex-1" />
                    {user.licensePhoto && (
                      <button
                        onClick={() => setPreviewUrl(user.licensePhoto)}
                        className="flex items-center gap-1.5 rounded-lg border border-[rgb(var(--color-border))] px-3 py-1.5 text-[12px] font-medium text-[rgb(var(--color-text-secondary))] hover:border-[rgb(var(--color-primary))] hover:text-[rgb(var(--color-primary))]"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        צפה
                      </button>
                    )}
                    <button
                      onClick={() => handleReview(user.id, "license", "APPROVED")}
                      disabled={reviewing === `${user.id}-license`}
                      className="flex items-center gap-1.5 rounded-lg bg-[rgba(var(--color-success),0.1)] px-3 py-1.5 text-[12px] font-semibold text-[rgb(var(--color-success))] hover:bg-[rgba(var(--color-success),0.2)] disabled:opacity-40"
                    >
                      <CheckCircle className="h-3.5 w-3.5" />
                      אשר
                    </button>
                    <button
                      onClick={() => handleReview(user.id, "license", "REJECTED")}
                      disabled={reviewing === `${user.id}-license`}
                      className="flex items-center gap-1.5 rounded-lg bg-[rgba(var(--color-error),0.1)] px-3 py-1.5 text-[12px] font-semibold text-[rgb(var(--color-error))] hover:bg-[rgba(var(--color-error),0.2)] disabled:opacity-40"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      דחה
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
