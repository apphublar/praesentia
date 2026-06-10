export const CREATE_EVENT_PATH = "/dashboard/criar";

export function createEventContinuePath(eventId: string) {
  return `/dashboard/criar/continuar/${eventId}`;
}

export function loginPathWithNext(nextPath: string) {
  return `/login?next=${encodeURIComponent(nextPath)}`;
}

export const PROTECTED_ROUTE_PREFIXES = ["/dashboard", "/admin", "/criar"] as const;

export function isProtectedRoute(pathname: string) {
  return PROTECTED_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}
