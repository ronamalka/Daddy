/** Wraps email body in a branded RTL layout. */
function layout(content: string): string {
  return `<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>אבאל׳ה</title>
</head>
<body style="margin:0;padding:0;background-color:#f5f5f5;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#2563eb 0%,#60a5fa 50%,#f59e0b 100%);padding:28px 24px;text-align:center;">
              <h1 style="margin:0;font-size:28px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">אבאל׳ה</h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px 28px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 28px;border-top:1px solid #e5e7eb;text-align:center;">
              <p style="margin:0;font-size:12px;color:#9ca3af;">
                אבאל׳ה &mdash; השוק שבו כישרון פוגש הזדמנות
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/** Email sent after registration asking the user to verify their address. */
export function verificationEmail(name: string, link: string): string {
  return layout(`
    <h2 style="margin:0 0 12px;font-size:20px;font-weight:700;color:#1e293b;">שלום ${name},</h2>
    <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#475569;">
      תודה שהצטרפת לאבאל׳ה! לחץ על הכפתור למטה כדי לאמת את כתובת האימייל שלך.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center" style="padding:8px 0 24px;">
          <a href="${link}" style="display:inline-block;background-color:#2563eb;color:#ffffff;font-size:16px;font-weight:600;text-decoration:none;padding:14px 36px;border-radius:12px;">
            אמת את האימייל שלי
          </a>
        </td>
      </tr>
    </table>
    <p style="margin:0 0 8px;font-size:13px;line-height:1.5;color:#94a3b8;">
      הקישור תקף ל-24 שעות. אם לא ביקשת את האימייל הזה, אפשר להתעלם ממנו.
    </p>
    <p style="margin:0;font-size:12px;color:#cbd5e1;word-break:break-all;">
      ${link}
    </p>
  `);
}

/** Email sent when someone tries to register with an already-registered address. */
export function accountExistsEmail(name: string, resetLink: string): string {
  return layout(`
    <h2 style="margin:0 0 12px;font-size:20px;font-weight:700;color:#1e293b;">שלום ${name},</h2>
    <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#475569;">
      מישהו ניסה להירשם לאבאל׳ה עם כתובת האימייל הזו, אבל כבר קיים חשבון על השם הזה.
    </p>
    <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#475569;">
      אם זה היית את/ה, אפשר להתחבר לחשבון הקיים. אם שכחת את הסיסמה, לחץ למטה כדי לאפס אותה.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center" style="padding:8px 0 24px;">
          <a href="${resetLink}" style="display:inline-block;background-color:#2563eb;color:#ffffff;font-size:16px;font-weight:600;text-decoration:none;padding:14px 36px;border-radius:12px;">
            איפוס סיסמה
          </a>
        </td>
      </tr>
    </table>
    <p style="margin:0;font-size:13px;line-height:1.5;color:#94a3b8;">
      אם לא ניסית להירשם, אפשר להתעלם מהאימייל הזה. החשבון שלך בטוח.
    </p>
  `);
}

/** Email with a password-reset link. */
export function passwordResetEmail(name: string, link: string): string {
  return layout(`
    <h2 style="margin:0 0 12px;font-size:20px;font-weight:700;color:#1e293b;">שלום ${name},</h2>
    <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#475569;">
      קיבלנו בקשה לאיפוס הסיסמה שלך. לחץ על הכפתור למטה כדי לבחור סיסמה חדשה.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center" style="padding:8px 0 24px;">
          <a href="${link}" style="display:inline-block;background-color:#2563eb;color:#ffffff;font-size:16px;font-weight:600;text-decoration:none;padding:14px 36px;border-radius:12px;">
            איפוס סיסמה
          </a>
        </td>
      </tr>
    </table>
    <p style="margin:0 0 8px;font-size:13px;line-height:1.5;color:#94a3b8;">
      הקישור תקף לשעה אחת. אם לא ביקשת איפוס סיסמה, אפשר להתעלם מהאימייל הזה.
    </p>
    <p style="margin:0;font-size:12px;color:#cbd5e1;word-break:break-all;">
      ${link}
    </p>
  `);
}
