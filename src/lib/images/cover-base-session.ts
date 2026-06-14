const KEY_PREFIX = "praesentia:cover-base:";

export function readCoverBaseFromSession(eventId: string) {
  if (typeof window === "undefined") return null;
  try {
    const value = sessionStorage.getItem(`${KEY_PREFIX}${eventId}`);
    return value && value.length > 0 ? value : null;
  } catch {
    return null;
  }
}

export function writeCoverBaseToSession(eventId: string, url: string) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(`${KEY_PREFIX}${eventId}`, url);
  } catch {
    /* ignore quota / private mode */
  }
}

export function clearCoverBaseSession(eventId: string) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(`${KEY_PREFIX}${eventId}`);
  } catch {
    /* ignore */
  }
}
