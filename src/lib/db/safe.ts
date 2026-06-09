export async function safeRepositoryCall<T>(fn: () => Promise<T>, fallback: T, label: string): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    console.error(`[praesentia] ${label} failed`, error);
    return fallback;
  }
}
