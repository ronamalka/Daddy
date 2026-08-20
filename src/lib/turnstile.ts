const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

interface TurnstileResult {
  success: boolean;
  challenge_ts?: string;
  hostname?: string;
  "error-codes"?: string[];
}

export async function verifyTurnstileToken(token: string, ip?: string): Promise<boolean> {
  const TURNSTILE_SECRET = process.env.TURNSTILE_SECRET_KEY || "";
  if (!TURNSTILE_SECRET) {
    if (process.env.NODE_ENV !== "production") return true;
    console.error("[turnstile] TURNSTILE_SECRET_KEY is not set");
    return false;
  }

  try {
    const body: Record<string, string> = {
      secret: TURNSTILE_SECRET,
      response: token,
    };
    if (ip) body.remoteip = ip;

    const res = await fetch(VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(body),
    });

    if (!res.ok) {
      console.error(`[turnstile] Verification request failed: ${res.status}`);
      return false;
    }

    const result: TurnstileResult = await res.json();
    if (!result.success) {
      console.warn(`[turnstile] Verification failed: ${result["error-codes"]?.join(", ")}`);
    }
    return result.success;
  } catch (err) {
    console.error("[turnstile] Verification error:", err);
    return false;
  }
}
