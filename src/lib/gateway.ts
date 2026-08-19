const USERS_SERVICE = process.env.USERS_SERVICE_URL || "http://localhost:4001";
const GIGS_SERVICE = process.env.GIGS_SERVICE_URL || "http://localhost:4002";
const ORDERS_SERVICE = process.env.ORDERS_SERVICE_URL || "http://localhost:4003";
const REQUESTS_SERVICE = process.env.REQUESTS_SERVICE_URL || "http://localhost:4004";

export { USERS_SERVICE, GIGS_SERVICE, ORDERS_SERVICE, REQUESTS_SERVICE };

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
    headers["x-user"] = JSON.stringify(user);
  }

  const fetchOptions: RequestInit = {
    method,
    headers,
  };

  if (body && method !== "GET") {
    fetchOptions.body = JSON.stringify(body);
  }

  const res = await fetch(`${serviceUrl}${path}`, fetchOptions);
  const data = await res.json();

  return { data, status: res.status };
}
