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
  const match = raw.match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : raw.slice(0, 10);
}

export function normalizeEventTimeString(value: unknown): string {
  if (!value) return "00:00";
  const raw = String(value).trim();
  const match = raw.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return "00:00";
  return `${match[1].padStart(2, "0")}:${match[2]}`;
}

/** Horário local do servidor — datas já vêm como YYYY-MM-DD do cadastro. */
export function parseEventDateTime(dateValue: unknown, timeValue: unknown) {
  const date = normalizeEventDateString(dateValue);
  const time = normalizeEventTimeString(timeValue);
  const [year, month, day] = date.split("-").map(Number);
  const [hours, minutes] = time.split(":").map(Number);
  return new Date(year, month - 1, day, hours, minutes, 0, 0);
}
