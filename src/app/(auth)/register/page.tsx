"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useRef, useCallback } from "react";
import { LocationPicker } from "@/components/location-picker";
import { ServicePicker } from "@/components/service-picker";
import { PasswordStrength } from "@/components/password-strength";
import { TurnstileWidget } from "@/components/turnstile-widget";

interface ServiceAreaEntry {
  districtCode: number;
  districtName: string;
  cityCode?: number;
  cityName?: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("BUYER");

  const [selectedCity, setSelectedCity] = useState<{ cityCode: number; cityName: string; districtCode: number; districtName: string } | null>(null);
  const [serviceAreas, setServiceAreas] = useState<ServiceAreaEntry[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [turnstileToken, setTurnstileToken] = useState("");
  const formLoadedAtRef = useRef(Date.now());
  const handleTurnstileVerify = useCallback((token: string) => setTurnstileToken(token), []);
  const handleTurnstileExpire = useCallback(() => setTurnstileToken(""), []);

  const totalSteps = role === "SELLER" ? 3 : 2;

  async function handleSubmit() {
    setLoading(true);
    setError("");

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        email,
        password,
        role,
        cityCode: selectedCity?.cityCode,
        cityName: selectedCity?.cityName,
        districtCode: selectedCity?.districtCode,
        serviceAreas: role === "SELLER" ? serviceAreas : [],
        services: role === "SELLER" ? selectedServices : [],
        turnstileToken,
        _hp_field: "",
        _formLoadedAt: formLoadedAtRef.current,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "ההרשמה נכשלה");
      setLoading(false);
      return;
    }

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("החשבון נוצר אבל ההתחברות נכשלה. נסה להתחבר מחדש.");
      setLoading(false);
    } else {
      router.push("/");
      router.refresh();
    }
  }

  function handleNext() {
    if (step === 1) {
      setStep(2);
    } else if (step === 2 && role === "SELLER") {
      setStep(3);
    } else {
      handleSubmit();
    }
  }

  const [googleLoading, setGoogleLoading] = useState(false);

  async function handleGoogleSignUp() {
    setGoogleLoading(true);
    await signIn("google", { callbackUrl: "/" });
  }

  const inputClass = "w-full rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface-elevated))] px-4 py-3 text-[16px] text-[rgb(var(--color-text))] placeholder-[rgb(var(--color-text-muted))] transition-all focus:border-[rgb(var(--color-primary))] focus:outline-none focus:ring-2 focus:ring-[rgba(var(--color-primary),0.2)]";

  const stepTitles = [
    "בוא נכיר",
    "איפה אתה פועל?",
    "מה אתה יודע לעשות?",
  ];

  const stepDescs = [
    "הצטרף למשפחת האבאל׳ות — זה לוקח דקה, ואף ארון לא ייפגע",
    role === "SELLER" ? "סמן את האזורים שבהם אתה מוכן להגיע ולסדר" : "ספר לנו איפה אתה כדי שנמצא לך אבאל׳ה בשכונה",
    "סמן מה אתה יודע לתקן, להרכיב, או לחסוך — ונחבר אותך ללקוחות",
  ];

  return (
    <div className="w-full max-w-md">
      <div className="mb-8 text-center lg:hidden">
        <h2
          className="text-3xl font-extrabold tracking-[-0.02em] bg-clip-text text-transparent"
          style={{ backgroundImage: "linear-gradient(135deg, rgb(var(--color-primary)) 0%, rgb(var(--color-primary-light)) 50%, rgb(var(--color-accent)) 100%)" }}
        >
          אבאל׳ה
        </h2>
      </div>

      <div className="rounded-2xl bg-[rgb(var(--color-surface))] p-8 shadow-[0_4px_16px_rgba(var(--color-primary),0.08)]">
        <div className="mb-6 flex items-center justify-center gap-2">
          {Array.from({ length: totalSteps }, (_, i) => i + 1).map((s) => (
            <div
              key={s}
              className={`h-2 rounded-full transition-all ${
                s === step ? "w-8 bg-[rgb(var(--color-primary))]" : s < step ? "w-8 bg-[rgb(var(--color-primary-light))]" : "w-8 bg-[rgb(var(--color-border))]"
              }`}
            />
          ))}
        </div>

        <h1 className="mb-2 text-center text-[24px] font-bold tracking-[-0.01em] text-[rgb(var(--color-text))]">
          {stepTitles[step - 1]}
        </h1>
        <p className="mb-6 text-center text-[14px] text-[rgb(var(--color-text-secondary))]">
          {stepDescs[step - 1]}
        </p>

        {error && (
          <div role="alert" className="mb-4 flex items-center gap-2 rounded-xl bg-[rgba(var(--color-error),0.1)] px-4 py-3 text-[14px] text-[rgb(var(--color-error))]">
            <svg className="h-4 w-4 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        )}

        {step === 1 && (
          <div className="space-y-5">
            <button
              type="button"
              onClick={handleGoogleSignUp}
              disabled={googleLoading || loading}
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface-elevated))] py-3.5 text-[16px] font-medium text-[rgb(var(--color-text))] transition-all hover:bg-[rgb(var(--color-bg))] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {googleLoading ? (
                <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
              )}
              הרשמה עם Google
            </button>

            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-[rgb(var(--color-border))]" />
              <span className="text-[13px] text-[rgb(var(--color-text-muted))]">או</span>
              <div className="h-px flex-1 bg-[rgb(var(--color-border))]" />
            </div>

          <form onSubmit={(e) => { e.preventDefault(); handleNext(); }} className="space-y-5">
            <div>
              <label htmlFor="name" className="mb-1.5 block text-[14px] font-medium text-[rgb(var(--color-text))]">שם מלא</label>
              <input id="name" required placeholder="ישראל ישראלי" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label htmlFor="email" className="mb-1.5 block text-[14px] font-medium text-[rgb(var(--color-text))]">אימייל</label>
              <input id="email" type="email" required placeholder="you@example.com" dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label htmlFor="password" className="mb-1.5 block text-[14px] font-medium text-[rgb(var(--color-text))]">סיסמה</label>
              <input id="password" type="password" required minLength={8} placeholder="לפחות 8 תווים, אות גדולה, ספרה ותו מיוחד" value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} />
              <PasswordStrength password={password} />
            </div>
            <div>
              <label className="mb-1.5 block text-[14px] font-medium text-[rgb(var(--color-text))]">אני רוצה</label>
              <div className="grid grid-cols-2 gap-3">
                <label className="relative cursor-pointer">
                  <input type="radio" name="role" value="BUYER" checked={role === "BUYER"} onChange={() => setRole("BUYER")} className="peer sr-only" />
                  <div className="rounded-xl border-2 border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface-elevated))] p-4 text-center transition-all peer-checked:border-[rgb(var(--color-primary))] peer-checked:bg-[rgba(var(--color-primary),0.1)]">
                    <div className="mb-1">
                      <svg className="mx-auto h-7 w-7 text-[rgb(var(--color-text-secondary))]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
                      </svg>
                    </div>
                    <span className="text-[14px] font-semibold text-[rgb(var(--color-text))]">לקנות שירותים</span>
                  </div>
                </label>
                <label className="relative cursor-pointer">
                  <input type="radio" name="role" value="SELLER" checked={role === "SELLER"} onChange={() => setRole("SELLER")} className="peer sr-only" />
                  <div className="rounded-xl border-2 border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface-elevated))] p-4 text-center transition-all peer-checked:border-[rgb(var(--color-primary))] peer-checked:bg-[rgba(var(--color-primary),0.1)]">
                    <div className="mb-1">
                      <svg className="mx-auto h-7 w-7 text-[rgb(var(--color-text-secondary))]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z" />
                      </svg>
                    </div>
                    <span className="text-[14px] font-semibold text-[rgb(var(--color-text))]">למכור שירותים</span>
                  </div>
                </label>
              </div>
            </div>
            <div aria-hidden="true" className="absolute -left-[9999px] -top-[9999px]">
              <label htmlFor="hp-reg">Leave empty</label>
              <input id="hp-reg" type="text" name="_hp_field" tabIndex={-1} autoComplete="off" />
            </div>
            <TurnstileWidget onVerify={handleTurnstileVerify} onExpire={handleTurnstileExpire} />
            <button type="submit" className="w-full rounded-xl bg-[rgb(var(--color-primary))] py-3.5 text-[16px] font-semibold text-white shadow-[0_4px_16px_rgba(var(--color-primary),0.08)] transition-all hover:bg-[rgb(var(--color-primary-hover))] active:scale-[0.98]">
              המשך
            </button>
          </form>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            {role === "SELLER" ? (
              <LocationPicker mode="multi" areas={serviceAreas} onAreasChange={setServiceAreas} label="אזורי שירות" />
            ) : (
              <LocationPicker
                mode="single"
                value={selectedCity ? { cityCode: selectedCity.cityCode, districtCode: selectedCity.districtCode } : undefined}
                onChange={setSelectedCity}
                label="העיר שלך"
              />
            )}

            <div className="flex gap-3">
              <button type="button" onClick={() => setStep(1)} className="flex-1 rounded-xl border border-[rgb(var(--color-border))] py-3.5 text-[16px] font-semibold text-[rgb(var(--color-text-secondary))] transition-all hover:bg-[rgb(var(--color-surface-elevated))]">
                רגע, חושב שנית
              </button>
              <button
                type="button"
                onClick={handleNext}
                disabled={loading}
                className="flex-1 rounded-xl bg-[rgb(var(--color-primary))] py-3.5 text-[16px] font-semibold text-white shadow-[0_4px_16px_rgba(var(--color-primary),0.08)] transition-all hover:bg-[rgb(var(--color-primary-hover))] active:scale-[0.98] disabled:opacity-50"
              >
                {role === "SELLER" ? "המשך" : loading ? "יוצר חשבון..." : "צור חשבון"}
              </button>
            </div>

            <button type="button" onClick={handleSubmit} disabled={loading} className="w-full text-center text-[13px] text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-text-secondary))] transition-colors">
              דלג, אבחר אחר כך
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <div className="max-h-[400px] overflow-y-auto">
              <ServicePicker selected={selectedServices} onChange={setSelectedServices} />
            </div>

            {selectedServices.length > 0 && (
              <p className="text-center text-[13px] text-[rgb(var(--color-primary))] font-medium">
                {selectedServices.length} שירותים נבחרו
              </p>
            )}

            <div className="flex gap-3">
              <button type="button" onClick={() => setStep(2)} className="flex-1 rounded-xl border border-[rgb(var(--color-border))] py-3.5 text-[16px] font-semibold text-[rgb(var(--color-text-secondary))] transition-all hover:bg-[rgb(var(--color-surface-elevated))]">
                רגע, חושב שנית
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 rounded-xl bg-[rgb(var(--color-primary))] py-3.5 text-[16px] font-semibold text-white shadow-[0_4px_16px_rgba(var(--color-primary),0.08)] transition-all hover:bg-[rgb(var(--color-primary-hover))] active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    יוצר חשבון...
                  </span>
                ) : "צור חשבון"}
              </button>
            </div>

            <button type="button" onClick={handleSubmit} disabled={loading} className="w-full text-center text-[13px] text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-text-secondary))] transition-colors">
              דלג, אבחר אחר כך
            </button>
          </div>
        )}

        <div className="mt-6 text-center">
          <p className="text-[14px] text-[rgb(var(--color-text-secondary))]">
            כבר במשפחה?{" "}
            <Link href="/login" className="font-semibold text-[rgb(var(--color-primary))] transition-colors hover:text-[rgb(var(--color-primary-hover))]">
              התחבר
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
