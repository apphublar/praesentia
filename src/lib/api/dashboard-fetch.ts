type JsonRecord = Record<string, unknown>;

export class DashboardApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function readJsonResponse(response: Response): Promise<JsonRecord> {
  const text = await response.text();
  if (!text) {
    if (response.status === 524 || response.status === 504 || response.status === 522) {
      throw new DashboardApiError(
        response.status,
        "A operação demorou demais. A IA pode levar até 1 minuto — aguarde e tente novamente."
      );
    }
    return {};
  }

  try {
    return JSON.parse(text) as JsonRecord;
  } catch {
    if (response.status === 401) {
      throw new DashboardApiError(401, "Sessão expirada. Faça login novamente.");
    }
    if (response.status === 524 || response.status === 504 || response.status === 522) {
      throw new DashboardApiError(
        response.status,
        "A operação demorou demais. A IA pode levar até 1 minuto — aguarde e tente novamente."
      );
    }
    throw new DashboardApiError(response.status, `Resposta inválida do servidor (${response.status}).`);
  }
}

export async function dashboardFetchJson(url: string, init?: RequestInit) {
  const response = await fetch(url, {
    ...init,
    credentials: "same-origin",
    headers: {
      ...(init?.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...init?.headers
    }
  });
  const data = await readJsonResponse(response);
  return { response, data };
}

export function apiErrorMessage(error: unknown, fallback: string) {
  if (error instanceof DashboardApiError) return error.message;
  return fallback;
}
