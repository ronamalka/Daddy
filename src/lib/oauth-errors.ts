/** Maps Auth.js / Google OAuth error codes to a Hebrew message for the login page. */
export function googleAuthErrorMessage(
  error: string | null | undefined,
  code?: string | null
): string {
  if (code === "google_account") {
    return "החשבון הזה מתחבר עם Google. לחץ על המשך עם Google.";
  }

  switch (error) {
    case "AccessDenied":
      return "הגישה נדחתה. אם ביטלת את האישור ב-Google, אפשר לנסות שוב.";
    case "Configuration":
      return "התחברות עם Google עדיין לא מוגדרת. פנה לתמיכה.";
    case "OAuthAccountNotLinked":
      return "האימייל הזה כבר רשום. התחבר עם סיסמה, או השתמש באותו חשבון Google.";
    case "OAuthCallback":
    case "OAuthSignin":
    case "Callback":
    case "OAuthCreateAccount":
      return "ההתחברות עם Google נכשלה. נסה שוב.";
    default:
      return "ההתחברות עם Google נכשלה. נסה שוב.";
  }
}
