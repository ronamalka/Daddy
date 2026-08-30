type SecurityEventType =
  | "login_success"
  | "login_failure"
  | "login_lockout"
  | "password_reset_requested"
  | "password_reset_completed"
  | "password_changed"
  | "csrf_violation"
  | "rate_limit_exceeded"
  | "auth_failure"
  | "session_revoked"
  | "admin_action";

interface SecurityEvent {
  timestamp: string;
  event: SecurityEventType;
  ip?: string;
  userAgent?: string;
  userId?: string;
  email?: string;
  outcome: "success" | "failure" | "blocked";
  metadata?: Record<string, unknown>;
}

export function logSecurityEvent(
  event: SecurityEventType,
  details: Omit<SecurityEvent, "timestamp" | "event">
) {
  const entry: SecurityEvent = {
    timestamp: new Date().toISOString(),
    event,
    ...details,
  };

  console.log(`[SECURITY] ${JSON.stringify(entry)}`);
}

export function extractClientInfo(request: Request): {
  ip: string;
  userAgent: string;
} {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded
    ? forwarded.split(",")[0].trim()
    : request.headers.get("x-real-ip") || "unknown";
  const userAgent = request.headers.get("user-agent") || "unknown";
  return { ip, userAgent };
}
