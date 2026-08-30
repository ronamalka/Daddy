"use client";

/** Reads the csrf_token cookie in the browser. Returns null on the server or if missing. */
function getCsrfToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

const MUTATION_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

let patched = false;

/** Wraps fetch so same-origin POST, PUT, PATCH, and DELETE send the CSRF header. */
export function installCsrfInterceptor() {
  if (typeof window === "undefined" || patched) return;
  patched = true;

  const originalFetch = window.fetch.bind(window);

  /** Adds the CSRF cookie value to mutating same-origin fetch calls. */
  window.fetch = async function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const method = (init?.method || "GET").toUpperCase();
    const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
    const isSameOrigin = url.startsWith("/") || url.startsWith(window.location.origin);

    if (isSameOrigin && MUTATION_METHODS.has(method)) {
      const token = getCsrfToken();
      if (token) {
        const headers = new Headers(init?.headers);
        if (!headers.has("x-csrf-token")) {
          headers.set("x-csrf-token", token);
        }
        init = { ...init, headers };
      }
    }

    return originalFetch(input, init);
  };
}
