import crypto from "crypto";

const USERS_SERVICE = process.env.USERS_SERVICE_URL || "http://localhost:4001";
const GIGS_SERVICE = process.env.GIGS_SERVICE_URL || "http://localhost:4002";
const ORDERS_SERVICE = process.env.ORDERS_SERVICE_URL || "http://localhost:4003";
const REQUESTS_SERVICE = process.env.REQUESTS_SERVICE_URL || "http://localhost:4004";
const CHAT_SERVICE = process.env.CHAT_SERVICE_URL || "http://localhost:4005";

const INTER_SERVICE_SECRET = process.env.INTER_SERVICE_SECRET || "dev-secret-change-in-production";

export { USERS_SERVICE, GIGS_SERVICE, ORDERS_SERVICE, REQUESTS_SERVICE, CHAT_SERVICE };

export function signPayload(payload: string): string {
  return crypto.createHmac("sha256", INTER_SERVICE_SECRET).update(payload).digest("hex");
}

interface ProxyOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
  user?: { id: string; email: string; name: string; role: string };
}

export async function proxyRequest(serviceUrl: string, path: string, options: ProxyOptions = {}) {
  const { method = "GET", body, user } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (user) {
    // HTTP headers are Latin-1; Hebrew names must be percent-encoded or fetch throws.
    const userPayload = encodeURIComponent(JSON.stringify(user));
    headers["x-user"] = userPayload;
    headers["x-user-signature"] = signPayload(userPayload);
  }

  const fetchOptions: RequestInit = {
    method,
    headers,
  };

  if (body && method !== "GET") {
    fetchOptions.body = JSON.stringify(body);
  }

  try {
    const res = await fetch(`${serviceUrl}${path}`, fetchOptions);
    const data = await res.json().catch(() => null);
    return { data, status: res.status };
  } catch {
    return { data: null, status: 502 };
  }
}
