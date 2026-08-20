const MIN_SUBMISSION_TIME_MS = parseInt(process.env.BOT_MIN_SUBMISSION_MS || "3000", 10);

interface BotCheckInput {
  honeypot?: string;
  formLoadedAt?: number;
  headers: Headers;
}

interface BotCheckResult {
  isBot: boolean;
  reason?: string;
}

export function detectBot(input: BotCheckInput): BotCheckResult {
  if (input.honeypot) {
    return { isBot: true, reason: "honeypot_filled" };
  }

  if (input.formLoadedAt) {
    const elapsed = Date.now() - input.formLoadedAt;
    if (elapsed < MIN_SUBMISSION_TIME_MS) {
      return { isBot: true, reason: "submission_too_fast" };
    }
  }

  const ua = input.headers.get("user-agent");
  if (!ua || ua.length < 10) {
    return { isBot: true, reason: "missing_user_agent" };
  }

  const accept = input.headers.get("accept");
  if (!accept) {
    return { isBot: true, reason: "missing_accept_header" };
  }

  const acceptLang = input.headers.get("accept-language");
  if (!acceptLang) {
    return { isBot: true, reason: "missing_accept_language" };
  }

  return { isBot: false };
}
