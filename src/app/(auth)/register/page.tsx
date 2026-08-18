"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LocationPicker } from "@/components/location-picker";

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

  const inputClass = "w-full rounded-[12px] border border-[#E8ECF1] bg-[#FAFBFF] px-4 py-3 text-[16px] text-[#2D3436] placeholder-[#B2BEC3] transition-all focus:border-[#6C5CE7] focus:outline-none focus:ring-2 focus:ring-[#6C5CE7]/20";

  return (
    <div className="w-full max-w-md">
      <div className="mb-8 text-center lg:hidden">
        <h2
          className="text-3xl font-extrabold tracking-[-0.02em] bg-clip-text text-transparent"
          style={{ backgroundImage: "linear-gradient(135deg, #6C5CE7 0%, #A29BFE 50%, #00D2D3 100%)" }}
        >
          אבאל׳ה
        </h2>
      </div>

      <div className="rounded-[16px] bg-[#FFFFFF] p-8 shadow-[0_4px_16px_rgba(108,92,231,0.08)]">
        {/* Step indicator */}
        <div className="mb-6 flex items-center justify-center gap-2">
          {[1, 2].map((s) => (
            <div
              key={s}
              className={`h-2 rounded-full transition-all ${
                s === step ? "w-8 bg-[#6C5CE7]" : s < step ? "w-8 bg-[#A29BFE]" : "w-8 bg-[#E8ECF1]"
              }`}
            />
          ))}
        </div>

        <h1 className="mb-2 text-center text-[24px] font-bold tracking-[-0.01em] text-[#2D3436]">
          {step === 1 ? "צור חשבון חדש" : "איפה אתה נמצא?"}
        </h1>
        <p className="mb-6 text-center text-[14px] text-[#636E72]">
          {step === 1
            ? "הצטרף לקהילה והתחל את המסע שלך"
            : role === "SELLER"
            ? "בחר את האזורים בהם אתה נותן שירות"
            : "בחר את העיר שלך כדי למצוא אבאל׳ות קרובים"}
        </p>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-[12px] bg-[#E17055]/10 px-4 py-3 text-[14px] text-[#E17055]">
            <svg className="h-4 w-4 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        )}

        {step === 1 && (
          <form onSubmit={(e) => { e.preventDefault(); setStep(2); }} className="space-y-5">
            <div>
              <label htmlFor="name" className="mb-1.5 block text-[14px] font-medium text-[#2D3436]">שם מלא</label>
              <input id="name" required placeholder="ישראל ישראלי" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label htmlFor="email" className="mb-1.5 block text-[14px] font-medium text-[#2D3436]">אימייל</label>
              <input id="email" type="email" required placeholder="you@example.com" dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label htmlFor="password" className="mb-1.5 block text-[14px] font-medium text-[#2D3436]">סיסמה</label>
              <input id="password" type="password" required minLength={6} placeholder="לפחות 6 תווים" value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="mb-1.5 block text-[14px] font-medium text-[#2D3436]">אני רוצה</label>
              <div className="grid grid-cols-2 gap-3">
                <label className="relative cursor-pointer">
                  <input type="radio" name="role" value="BUYER" checked={role === "BUYER"} onChange={() => setRole("BUYER")} className="peer sr-only" />
                  <div className="rounded-[12px] border-2 border-[#E8ECF1] bg-[#FAFBFF] p-4 text-center transition-all peer-checked:border-[#6C5CE7] peer-checked:bg-[#F0EEFF]">
                    <div className="mb-1">
                      <svg className="mx-auto h-7 w-7 text-[#636E72]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
                      </svg>
                    </div>
                    <span className="text-[14px] font-semibold text-[#2D3436]">לקנות שירותים</span>
                  </div>
                </label>
                <label className="relative cursor-pointer">
                  <input type="radio" name="role" value="SELLER" checked={role === "SELLER"} onChange={() => setRole("SELLER")} className="peer sr-only" />
                  <div className="rounded-[12px] border-2 border-[#E8ECF1] bg-[#FAFBFF] p-4 text-center transition-all peer-checked:border-[#6C5CE7] peer-checked:bg-[#F0EEFF]">
                    <div className="mb-1">
                      <svg className="mx-auto h-7 w-7 text-[#636E72]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z" />
                      </svg>
                    </div>
                    <span className="text-[14px] font-semibold text-[#2D3436]">למכור שירותים</span>
                  </div>
                </label>
              </div>
            </div>
            <button type="submit" className="w-full rounded-[12px] bg-[#6C5CE7] py-3.5 text-[16px] font-semibold text-white shadow-[0_4px_16px_rgba(108,92,231,0.08)] transition-all hover:bg-[#5A4BD1] active:scale-[0.98]">
              המשך
            </button>
          </form>
        )}

        {step === 2 && (
          <div className="space-y-5">
            {role === "SELLER" ? (
              <LocationPicker
                mode="multi"
                areas={serviceAreas}
                onAreasChange={setServiceAreas}
                label="אזורי שירות"
              />
            ) : (
              <LocationPicker
                mode="single"
                value={selectedCity ? { cityCode: selectedCity.cityCode, districtCode: selectedCity.districtCode } : undefined}
                onChange={setSelectedCity}
                label="העיר שלך"
              />
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 rounded-[12px] border border-[#E8ECF1] py-3.5 text-[16px] font-semibold text-[#636E72] transition-all hover:bg-[#FAFBFF]"
              >
                חזרה
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 rounded-[12px] bg-[#6C5CE7] py-3.5 text-[16px] font-semibold text-white shadow-[0_4px_16px_rgba(108,92,231,0.08)] transition-all hover:bg-[#5A4BD1] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    יוצר חשבון...
                  </span>
                ) : (
                  "צור חשבון"
                )}
              </button>
            </div>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="w-full text-center text-[13px] text-[#B2BEC3] hover:text-[#636E72] transition-colors"
            >
              דלג, אבחר אחר כך
            </button>
          </div>
        )}

        <div className="mt-6 text-center">
          <p className="text-[14px] text-[#636E72]">
            כבר חבר?{" "}
            <Link href="/login" className="font-semibold text-[#6C5CE7] transition-colors hover:text-[#5A4BD1]">
              התחבר
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
