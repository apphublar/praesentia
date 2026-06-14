type AnalyticsPayload = Record<string, string | number | boolean | undefined>;

/** Dispara evento de conversão/analytics (dataLayer ou console em dev). */
export function trackEvent(eventName: string, params?: AnalyticsPayload) {
  if (typeof window === "undefined") return;
  const payload = { event: eventName, ...params };
  const w = window as Window & { dataLayer?: AnalyticsPayload[] };
  if (Array.isArray(w.dataLayer)) {
    w.dataLayer.push(payload);
    return;
  }
  if (process.env.NODE_ENV !== "production") {
    console.info("[analytics]", payload);
  }
}
