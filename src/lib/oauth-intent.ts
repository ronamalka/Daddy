/** Cookie that carries buyer/seller intent through the Google OAuth redirect. */
export const OAUTH_INTENT_COOKIE = "oauth_intent";

/** How long the intent cookie lives, in seconds. */
export const OAUTH_INTENT_MAX_AGE = 600;

/**
 * Auth.js callback path for the Google provider.
 * This exact URI (origin + path) must be listed as an Authorized redirect URI:
 * https://developers.google.com/identity/protocols/oauth2/web-server#uri-validation
 */
export const GOOGLE_OAUTH_CALLBACK_PATH = "/api/auth/callback/google";

/** Returns BUYER or SELLER from an OAuth intent cookie or form value. */
export function parseOauthRole(value: string | null | undefined): "BUYER" | "SELLER" {
  return value === "SELLER" ? "SELLER" : "BUYER";
}

/** Builds a client-settable cookie that survives the hop to Google and back. */
export function oauthIntentCookie(role: string): string {
  return `${OAUTH_INTENT_COOKIE}=${parseOauthRole(role)}; Path=/; Max-Age=${OAUTH_INTENT_MAX_AGE}; SameSite=Lax`;
}
