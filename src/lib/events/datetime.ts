/** Fuso horário do Brasil (sem horário de verão desde 2019). */
const BRAZIL_UTC_OFFSET_HOURS = -3;

/** Extrai YYYY-MM-DD de string ISO, Date ou texto do Postgres. */
export function normalizeEventDateString(value: unknown): string {
  if (!value) return "";
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const y = value.getUTCFullYear();
    const m = String(value.getUTCMonth() + 1).padStart(2, "0");
    const d = String(value.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  const raw = String(value).trim();
  const iso = raw.match(/^(\d{4}-\d{2}-\d{2})/);
  if (iso) return iso[1];

  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) {
    return normalizeEventDateString(parsed);
  }

  return "";
}

export function normalizeEventTimeString(value: unknown): string {
  if (!value) return "00:00";
  const raw = String(value).trim();

  const isoTime = raw.match(/T(\d{1,2}):(\d{2})/);
  if (isoTime) {
    return `${isoTime[1].padStart(2, "0")}:${isoTime[2]}`;
  }

  const timeMatch = raw.match(/^(\d{1,2}):(\d{2})/);
  if (timeMatch) {
    return `${timeMatch[1].padStart(2, "0")}:${timeMatch[2]}`;
  }

  return "00:00";
}

export function isValidEventInstant(value: Date) {
  return !Number.isNaN(value.getTime());
}

/**
 * Converte data + horário do cadastro (horário de Brasília) em instante UTC.
 * Garante o mesmo comportamento no servidor (Vercel) e no navegador do convidado.
 */
export function parseEventDateTime(dateValue: unknown, timeValue: unknown) {
  const date = normalizeEventDateString(dateValue);
  const time = normalizeEventTimeString(timeValue);
  const [year, month, day] = date.split("-").map(Number);
  const [hours, minutes] = time.split(":").map(Number);

  if (![year, month, day, hours, minutes].every(Number.isFinite)) {
    return new Date(Number.NaN);
  }

  return new Date(Date.UTC(year, month - 1, day, hours - BRAZIL_UTC_OFFSET_HOURS, minutes, 0, 0));
}
