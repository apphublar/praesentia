const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function parseEventDate(date?: string | null) {
  if (!date || !DATE_PATTERN.test(date)) return null;
  const parsed = new Date(`${date}T12:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function formatEventDateLong(date?: string | null) {
  const parsed = parseEventDate(date);
  if (!parsed) return null;
  return parsed.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  });
}

export function formatEventDateShort(date?: string | null) {
  const parsed = parseEventDate(date);
  if (!parsed) return null;
  return parsed.toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });
}

export function formatEventSchedule(date?: string | null, startsAt?: string, endsAt?: string) {
  const dateLabel = formatEventDateLong(date);
  const timeLabel = startsAt && endsAt ? `${startsAt}–${endsAt}` : startsAt || null;

  if (dateLabel && timeLabel) return `${dateLabel} · ${timeLabel}`;
  if (dateLabel) return dateLabel;
  if (timeLabel) return timeLabel;
  return "Data a confirmar";
}
