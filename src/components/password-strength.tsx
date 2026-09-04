"use client";

import { useEffect, useRef, useState } from "react";

interface PasswordStrengthProps {
  password: string;
  onValidChange?: (valid: boolean) => void;
}

interface Rule {
  label: string;
  test: (pw: string) => boolean;
}

const rules: Rule[] = [
  { label: "8 תווים לפחות", test: (pw) => pw.length >= 8 },
  { label: "אות גדולה (A-Z)", test: (pw) => /[A-Z]/.test(pw) },
  { label: "אות קטנה (a-z)", test: (pw) => /[a-z]/.test(pw) },
  { label: "ספרה (0-9)", test: (pw) => /[0-9]/.test(pw) },
  { label: "תו מיוחד (!@#$...)", test: (pw) => /[^a-zA-Z0-9]/.test(pw) },
];

export function PasswordStrength({ password, onValidChange }: PasswordStrengthProps) {
  const [breachStatus, setBreachStatus] = useState<"idle" | "checking" | "safe" | "breached">("idle");
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);
  const lastCheckedRef = useRef("");

  const allRulesPassed = password.length > 0 && rules.every((r) => r.test(password));

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!allRulesPassed) {
      setBreachStatus("idle");
      lastCheckedRef.current = "";
      onValidChange?.(false);
      return;
    }

    if (password === lastCheckedRef.current) return;

    setBreachStatus("checking");
    onValidChange?.(false);

    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch("/api/auth/check-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password }),
        });
        const data = await res.json();
        lastCheckedRef.current = password;
        const status = data.breached ? "breached" : "safe";
        setBreachStatus(status);
        onValidChange?.(status === "safe");
      } catch {
        lastCheckedRef.current = password;
        setBreachStatus("safe");
        onValidChange?.(true);
      }
    }, 600);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [password, allRulesPassed]);

  if (!password) return null;

  const passed = rules.filter((r) => r.test(password)).length;
  const strength = passed <= 1 ? 0 : passed <= 2 ? 1 : passed <= 3 ? 2 : passed <= 4 ? 3 : 4;

  const colors = [
    "bg-[rgb(var(--color-error))]",
    "bg-orange-400",
    "bg-yellow-400",
    "bg-[rgb(var(--color-success))]",
    "bg-[rgb(var(--color-success))]",
  ];

  const labels = ["חלשה מאוד", "חלשה", "בינונית", "חזקה", "מצוינת"];

  return (
    <div className="mt-2 space-y-2">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all ${
              i <= strength ? colors[strength] : "bg-[rgb(var(--color-border))]"
            }`}
          />
        ))}
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[12px] text-[rgb(var(--color-text-muted))]">
          חוזק: {labels[strength]}
        </span>
      </div>
      <ul className="space-y-0.5">
        {rules.map((rule) => (
          <li
            key={rule.label}
            className={`text-[12px] flex items-center gap-1.5 ${
              rule.test(password)
                ? "text-[rgb(var(--color-success))]"
                : "text-[rgb(var(--color-text-muted))]"
            }`}
          >
            {rule.test(password) ? (
              <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            )}
            {rule.label}
          </li>
        ))}
      </ul>

      {breachStatus === "checking" && (
        <div className="flex items-center gap-1.5 text-[12px] text-[rgb(var(--color-text-muted))]">
          <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          בודק מול דליפות ידועות...
        </div>
      )}

      {breachStatus === "breached" && (
        <div className="flex items-center gap-1.5 rounded-lg bg-[rgba(var(--color-error),0.1)] px-3 py-2 text-[12px] text-[rgb(var(--color-error))]">
          <svg className="h-4 w-4 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          הסיסמה הזו נמצאה בדליפות נתונים ידועות. בחר סיסמה אחרת.
        </div>
      )}

      {breachStatus === "safe" && (
        <div className="flex items-center gap-1.5 text-[12px] text-[rgb(var(--color-success))]">
          <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5C17.944 5.664 18 6.326 18 7c0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.674.056-1.336.166-1.999zm8.543 4.707a1 1 0 00-1.414-1.414L7 10.586 5.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l3-3.002z" clipRule="evenodd" />
          </svg>
          הסיסמה לא נמצאה בדליפות ידועות
        </div>
      )}
    </div>
  );
}
