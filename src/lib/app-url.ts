/** Base URL do app, sem barra final. Em produção usa o host canônico (www). */
export function getAppBaseUrl() {
  let url = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");

  if (process.env.APP_ENV === "production" && url.includes("://praesentia.com.br")) {
    url = url.replace("://praesentia.com.br", "://www.praesentia.com.br");
  }

  return url;
}

/** Callback de recuperação de senha — sem query string (exigência do allow list do Supabase). */
export function getAuthRecoveryCallbackUrl() {
  return `${getAppBaseUrl()}/auth/recovery`;
}

export function getAuthCallbackUrl(nextPath?: string) {
  const base = `${getAppBaseUrl()}/auth/callback`;
  if (!nextPath) return base;
  return `${base}?next=${encodeURIComponent(nextPath)}`;
}
