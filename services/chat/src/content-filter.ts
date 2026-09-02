/**
 * Scans chat messages for off-platform contact sharing attempts.
 *
 * Detects: phone numbers, emails, messenger app mentions, payment apps,
 * phrases suggesting contact sharing, external URLs, and obfuscation.
 */

export type FilterResult =
  | { blocked: false }
  | { blocked: true; reason: string; pattern: string };

interface PatternRule {
  /** Label stored in the violation log. */
  pattern: string;
  /** Human-readable reason (Hebrew). */
  reason: string;
  /** Returns true when the content matches this rule. */
  test: (content: string) => boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Strip common separators so "0 5 0-1.2 3 4 5 6 7" becomes "0501234567". */
function stripSeparators(text: string): string {
  return text.replace(/[\s.\-()]+/g, "");
}

/** Collapse Hebrew digit-word obfuscation. */
function replaceHebrewDigitWords(text: string): string {
  const words: Record<string, string> = {
    "אפס": "0",
    "אחת": "1",
    "אחד": "1",
    "שתיים": "2",
    "שניים": "2",
    "שתים": "2",
    "שנים": "2",
    "שלוש": "3",
    "ארבע": "4",
    "חמש": "5",
    "שש": "6",
    "שבע": "7",
    "שמונה": "8",
    "תשע": "9",
  };

  let result = text;
  for (const [word, digit] of Object.entries(words)) {
    result = result.replace(new RegExp(word, "g"), digit);
  }
  return result;
}

// ---------------------------------------------------------------------------
// Pattern rules
// ---------------------------------------------------------------------------

const PHONE_PATTERN: PatternRule = {
  pattern: "phone_number",
  reason: "מספר טלפון",
  test(content) {
    const stripped = stripSeparators(content);
    // Israeli mobile: 05X followed by 7 digits
    if (/05\d{8}/.test(stripped)) return true;
    // International format: +972 ...
    if (/\+?972\d{8,9}/.test(stripped)) return true;

    // Also check with Hebrew digit words replaced
    const deobfuscated = stripSeparators(replaceHebrewDigitWords(content));
    if (/05\d{8}/.test(deobfuscated)) return true;
    if (/\+?972\d{8,9}/.test(deobfuscated)) return true;

    return false;
  },
};

const EMAIL_PATTERN: PatternRule = {
  pattern: "email_address",
  reason: "כתובת אימייל",
  test(content) {
    return /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/.test(content);
  },
};

const MESSENGER_PATTERN: PatternRule = {
  pattern: "messenger_app",
  reason: "אזכור אפליקציית הודעות",
  test(content) {
    const lower = content.toLowerCase();
    const keywords = [
      "whatsapp", "וואצאפ", "ווטסאפ", "ווצאפ",
      "telegram", "טלגרם",
      "signal", "סיגנל",
    ];
    return keywords.some((kw) => lower.includes(kw));
  },
};

const PAYMENT_APP_PATTERN: PatternRule = {
  pattern: "payment_app",
  reason: "אזכור אפליקציית תשלום",
  test(content) {
    const lower = content.toLowerCase();
    const keywords = [
      "paybox", "פייבוקס",
      "pepper", "פפר",
      "paypal", "פייפאל",
    ];
    // "bit" / "ביט" need word-boundary matching to avoid false positives
    if (/\bbit\b/i.test(content)) return true;
    if (/ביט/.test(content)) return true;
    return keywords.some((kw) => lower.includes(kw));
  },
};

const CONTACT_PHRASE_PATTERN: PatternRule = {
  pattern: "contact_phrase",
  reason: "ניסיון להחלפת פרטי קשר",
  test(content) {
    const phrases = [
      "המספר שלי",
      "האימייל שלי",
      "המייל שלי",
      "תתקשר אליי",
      "תתקשרי אליי",
      "שלח לי הודעה",
      "שלחי לי הודעה",
      "תשלח לי ב",
      "תשלחי לי ב",
      "בוא נדבר ב",
      "בואי נדבר ב",
      "תוסיף אותי ב",
      "תוסיפי אותי ב",
    ];
    return phrases.some((phrase) => content.includes(phrase));
  },
};

const URL_PATTERN: PatternRule = {
  pattern: "external_url",
  reason: "קישור חיצוני",
  test(content) {
    const urlRegex = /https?:\/\/[^\s]+/gi;
    let match: RegExpExecArray | null;
    while ((match = urlRegex.exec(content)) !== null) {
      const url = match[0].toLowerCase();
      // Allow aballeh.com links
      if (/https?:\/\/(www\.)?aballeh\.com/i.test(url)) continue;
      return true;
    }
    return false;
  },
};

const OBFUSCATED_DIGITS_PATTERN: PatternRule = {
  pattern: "obfuscated_digits",
  reason: "ספרות מוסתרות",
  test(content) {
    // Look for sequences of digits separated by spaces/dots/dashes that form 7+ digits total
    // e.g. "0 5 0 1 2 3 4 5 6 7" or "050.123.4567"
    // We match runs of (digit + separator) that produce 7+ digits when collapsed.
    const digitRuns = content.match(/(?:\d[\s.\-]+){6,}\d/g);
    if (!digitRuns) return false;
    for (const run of digitRuns) {
      const digits = run.replace(/\D/g, "");
      if (digits.length >= 7) return true;
    }
    return false;
  },
};

// Order matters: more specific patterns first to give accurate "pattern" labels.
const RULES: PatternRule[] = [
  PHONE_PATTERN,
  EMAIL_PATTERN,
  MESSENGER_PATTERN,
  PAYMENT_APP_PATTERN,
  CONTACT_PHRASE_PATTERN,
  URL_PATTERN,
  OBFUSCATED_DIGITS_PATTERN,
];

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Scan a chat message for off-platform contact info. */
export function scanMessage(content: string): FilterResult {
  if (!content) return { blocked: false };

  for (const rule of RULES) {
    if (rule.test(content)) {
      return { blocked: true, reason: rule.reason, pattern: rule.pattern };
    }
  }

  return { blocked: false };
}
