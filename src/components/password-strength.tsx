"use client";

interface PasswordStrengthProps {
  password: string;
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

export function PasswordStrength({ password }: PasswordStrengthProps) {
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
    </div>
  );
}
