"use client";

import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useRef, useCallback, useEffect, Suspense } from "react";
import Link from "next/link";
import { SERVICE_CATEGORIES } from "@/lib/services";
import { UserCircle } from "@phosphor-icons/react";
import { TurnstileWidget } from "@/components/turnstile-widget";
import { LocationPicker } from "@/components/location-picker";
import { AddressPicker } from "@/components/address-picker";
import { RequestPhotosField } from "@/components/request-photos-field";
import { VisitWindowFields, visitWindowToIso, type VisitWindowValue } from "@/components/visit-window-fields";
import { PREFERRED_WINDOWS, PREFERRED_WINDOW_LABELS, type PreferredWindow } from "@/lib/request-details";
import { trackEvent } from "@/lib/analytics";

/** Shows the form to post a new service request. */
function CreateRequestPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const formLoadedAtRef = useRef(Date.now());
  const handleTurnstileVerify = useCallback((token: string) => setTurnstileToken(token), []);
  const handleTurnstileExpire = useCallback(() => setTurnstileToken(""), []);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [serviceSlug, setServiceSlug] = useState("");
  const [location, setLocation] = useState<{
    cityCode: number;
    cityName: string;
    districtCode: number;
    districtName: string;
  } | null>(null);
  const [visitWindow, setVisitWindow] = useState<VisitWindowValue | null>(null);
  const [preferredWindow, setPreferredWindow] = useState<PreferredWindow | "">("");
  const [street, setStreet] = useState("");
  const [floor, setFloor] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [photoError, setPhotoError] = useState("");
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [unlisted, setUnlisted] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);

  useEffect(() => {
    const preset = searchParams.get("service");
    if (preset) setServiceSlug(preset);
    trackEvent("request_started", { category: preset || "" });
  }, [searchParams]);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[rgba(var(--color-primary),0.2)] border-t-[rgb(var(--color-primary))]" />
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <div className="rounded-full bg-[rgba(var(--color-primary),0.1)] p-4 mb-4 inline-block">
          <UserCircle className="h-8 w-8 text-[rgb(var(--color-primary))]" />
        </div>
        <h2 className="text-[20px] font-bold text-[rgb(var(--color-text))]">צריך להתחבר</h2>
        <p className="mt-2 text-[14px] text-[rgb(var(--color-text-secondary))]">כדי לפרסם בקשת שירות, צריך קודם להתחבר או להירשם</p>
        <Link href="/register" className="mt-6 inline-block rounded-xl bg-[rgb(var(--color-primary))] px-6 py-3 text-[14px] font-bold text-white">
          הרשמה / התחברות
        </Link>
      </div>
    );
  }

  /** Creates a new service request from the form. */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!serviceSlug) {
      setError("יש לבחור סוג שירות");
      setLoading(false);
      return;
    }
    if (!location) {
      setError("יש לבחור עיר");
      setLoading(false);
      return;
    }
    if (!visitWindow?.date) {
      setError("יש לבחור חלון ביקור של שעתיים");
      setLoading(false);
      return;
    }

    const { slotStart, slotEnd } = visitWindowToIso(visitWindow);

    const res = await fetch("/api/service-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        description,
        serviceSlug,
        districtCode: location.districtCode,
        districtName: location.districtName,
        cityCode: location.cityCode,
        cityName: location.cityName,
        street,
        floor,
        preferredWindow: preferredWindow || null,
        photos,
        slotStart,
        slotEnd,
        unlisted,
        turnstileToken,
        _hp_field: "",
        _formLoadedAt: formLoadedAtRef.current,
      }),
    });

    if (res.ok) {
      trackEvent("request_submitted", { category: serviceSlug });
      const data = await res.json();
      router.push(`/requests/${data.id}`);
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "שגיאה בשליחת הבקשה");
      setLoading(false);
    }
  }

  const inputClass = "w-full rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-bg))] px-4 py-3 text-[14px] text-[rgb(var(--color-text))] placeholder-[rgb(var(--color-text-muted))] transition-all focus:border-[rgb(var(--color-primary))] focus:outline-none focus:ring-2 focus:ring-[rgba(var(--color-primary),0.2)]";

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-[28px] font-bold text-[rgb(var(--color-text))]">פרסם בקשת שירות</h1>
        <p className="mt-1 text-[14px] text-[rgb(var(--color-text-secondary))]">
          ספר מה אתה צריך ואבאל׳ות מנוסים ייצרו איתך קשר עם הצעות
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-xl bg-[rgba(var(--color-error),0.1)] px-4 py-3">
          <p className="text-[14px] font-medium text-[rgb(var(--color-error))]">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] p-6 shadow-sm">
          <h2 className="mb-5 text-[16px] font-bold text-[rgb(var(--color-text))]">מה אתה צריך?</h2>
          <div className="space-y-5">
            <div>
              <label className="mb-2 block text-[13px] font-semibold text-[rgb(var(--color-text-secondary))]">כותרת הבקשה</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="לדוגמה: צריך עזרה בהרכבת ארון מאיקאה"
                className={inputClass}
              />
            </div>

            <div>
              <label className="mb-2 block text-[13px] font-semibold text-[rgb(var(--color-text-secondary))]">תיאור מפורט</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows={4}
                placeholder="ספר בפירוט מה צריך לעשות ואיפה. ככל שתפרט יותר, כך תקבל הצעות מדויקות יותר."
                className={inputClass}
              />
            </div>

            <RequestPhotosField
              photos={photos}
              onChange={setPhotos}
              error={photoError}
              onError={setPhotoError}
              onUploading={setUploadingPhotos}
            />

            <div>
              <label className="mb-2 block text-[13px] font-semibold text-[rgb(var(--color-text-secondary))]">
                מתי לבוא? <span className="font-normal text-[rgb(var(--color-error))]">*</span>
              </label>
              <VisitWindowFields value={visitWindow} onChange={setVisitWindow} />
            </div>

            <fieldset>
              <legend className="mb-2 block text-[13px] font-semibold text-[rgb(var(--color-text-secondary))]">
                חלון מועדף
              </legend>
              <p className="mb-2 text-[12px] text-[rgb(var(--color-text-muted))]">
                עדיפות כללית בנוסף לחלון הביקור של שעתיים
              </p>
              <div className="flex flex-wrap gap-2">
                {PREFERRED_WINDOWS.map((pref) => (
                  <label
                    key={pref}
                    className={`cursor-pointer rounded-full border px-4 py-2 text-[13px] font-semibold transition-colors ${
                      preferredWindow === pref
                        ? "border-[rgb(var(--color-primary))] bg-[rgba(var(--color-primary),0.1)] text-[rgb(var(--color-primary))]"
                        : "border-[rgb(var(--color-border))] bg-[rgb(var(--color-bg))] text-[rgb(var(--color-text-secondary))]"
                    }`}
                  >
                    <input
                      type="radio"
                      name="preferredWindow"
                      value={pref}
                      checked={preferredWindow === pref}
                      onChange={() => setPreferredWindow(pref)}
                      className="sr-only"
                    />
                    {PREFERRED_WINDOW_LABELS[pref]}
                  </label>
                ))}
              </div>
            </fieldset>
          </div>
        </div>

        <div className="rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] p-6 shadow-sm">
          <h2 className="mb-5 text-[16px] font-bold text-[rgb(var(--color-text))]">שירות ומיקום</h2>
          <div className="space-y-5">
            <div>
              <label className="mb-2 block text-[13px] font-semibold text-[rgb(var(--color-text-secondary))]">
                סוג שירות <span className="font-normal text-[rgb(var(--color-error))]">*</span>
              </label>
              <select value={serviceSlug} onChange={(e) => setServiceSlug(e.target.value)} required className={inputClass}>
                <option value="">בחר שירות</option>
                {SERVICE_CATEGORIES.map((cat) => (
                  <optgroup key={cat.slug} label={cat.nameHe}>
                    {cat.services.map((svc) => (
                      <option key={svc.slug} value={svc.slug}>{svc.nameHe}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            <AddressPicker
              selectedId={selectedAddressId}
              onSelect={(addr) => {
                setSelectedAddressId(addr.id);
                if (addr.cityCode && addr.cityName && addr.districtCode && addr.districtName) {
                  setLocation({
                    cityCode: addr.cityCode,
                    cityName: addr.cityName,
                    districtCode: addr.districtCode,
                    districtName: addr.districtName,
                  });
                }
                setStreet(addr.street ?? "");
                setFloor(addr.floor ?? "");
              }}
            />

            <div>
              <LocationPicker
                mode="single"
                label="עיר"
                value={location ? { cityCode: location.cityCode, districtCode: location.districtCode } : undefined}
                onChange={(val) => {
                  setLocation(val);
                  setSelectedAddressId(null);
                }}
              />
            </div>

            <div>
              <label htmlFor="request-street" className="mb-2 block text-[13px] font-semibold text-[rgb(var(--color-text-secondary))]">
                רחוב
              </label>
              <input
                id="request-street"
                value={street}
                onChange={(e) => { setStreet(e.target.value); setSelectedAddressId(null); }}
                autoComplete="street-address"
                placeholder="לדוגמה: הרצל 12"
                className={inputClass}
              />
              <p className="mt-1.5 text-[12px] text-[rgb(var(--color-text-muted))]">
                הרחוב יוצג לאבא רק אחרי שתקבלו הצעה
              </p>
            </div>

            <div>
              <label htmlFor="request-floor" className="mb-2 block text-[13px] font-semibold text-[rgb(var(--color-text-secondary))]">
                קומה
              </label>
              <input
                id="request-floor"
                value={floor}
                onChange={(e) => { setFloor(e.target.value); setSelectedAddressId(null); }}
                placeholder="לדוגמה: 3"
                className={inputClass}
              />
            </div>

            <label className="flex items-start gap-3 rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-bg))] px-4 py-3">
              <input
                type="checkbox"
                checked={unlisted}
                onChange={(e) => setUnlisted(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-[rgb(var(--color-border))] text-[rgb(var(--color-primary))]"
              />
              <span>
                <span className="block text-[13px] font-semibold text-[rgb(var(--color-text))]">
                  אל תציגו את הבקשה בעמוד הציבורי
                </span>
                <span className="mt-0.5 block text-[12px] text-[rgb(var(--color-text-muted))]">
                  אבאל׳ות מחוברים עדיין יראו אותה. לא מופיעים שם רחוב, תמונות או שם הלקוח.
                </span>
              </span>
            </label>
          </div>
        </div>

        <div aria-hidden="true" className="absolute -left-[9999px] -top-[9999px]">
          <label htmlFor="hp-request">Leave empty</label>
          <input id="hp-request" type="text" name="_hp_field" tabIndex={-1} autoComplete="off" />
        </div>

        <TurnstileWidget onVerify={handleTurnstileVerify} onExpire={handleTurnstileExpire} />

        <button
          type="submit"
          disabled={loading || uploadingPhotos || !visitWindow?.date || !serviceSlug || !location}
          className="w-full rounded-xl bg-[rgb(var(--color-primary))] py-4 text-[15px] font-semibold text-white shadow-md transition-all hover:bg-[rgb(var(--color-primary-hover))]  disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              שולח לאבאל׳ות...
            </span>
          ) : "פרסם בקשה — אבאל׳ות יחזרו אליך"}
        </button>
      </form>
    </div>
  );
}

/** Shows the create-request page with a loading fallback. */
export default function CreateRequestPageWrapper() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[rgba(var(--color-primary),0.2)] border-t-[rgb(var(--color-primary))]" />
        </div>
      }
    >
      <CreateRequestPage />
    </Suspense>
  );
}
