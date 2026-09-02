type EventData = Record<string, string | number | boolean>;

/** Track a user action. Sends to Umami if loaded. */
export function trackEvent(name: string, data?: EventData): void {
  if (typeof window === "undefined") return;
  try {
    const umami = (window as any).umami;
    if (umami?.track) {
      umami.track(name, data);
    }
  } catch {
    // Analytics should never break the app
  }
}

/** Track a page view with optional referrer data. */
export function trackPageView(url?: string): void {
  if (typeof window === "undefined") return;
  try {
    const umami = (window as any).umami;
    if (umami?.track) {
      umami.track((props: Record<string, unknown>) => ({ ...props, url: url || window.location.pathname }));
    }
  } catch {
    // Silently fail
  }
}
