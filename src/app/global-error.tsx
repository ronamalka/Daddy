"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="he" dir="rtl">
      <body>
        <div style={{ textAlign: "center", padding: "4rem" }}>
          <h2>משהו השתבש</h2>
          <p>אנחנו עובדים על תיקון. נסו שוב בעוד כמה דקות.</p>
          <button
            onClick={() => reset()}
            style={{
              marginTop: "1rem",
              padding: "0.5rem 1.5rem",
              borderRadius: "0.5rem",
              border: "1px solid #ccc",
              cursor: "pointer",
            }}
          >
            נסו שוב
          </button>
        </div>
      </body>
    </html>
  );
}
