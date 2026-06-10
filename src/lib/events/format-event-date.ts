const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function parseEventDate(date?: string | null) {
  if (!date?.trim()) return null;
  const value = date.trim();
  const candidates = DATE_PATTERN.test(value)
    ? [`${value}T12:00:00`]
    : [value, `${value}T12:00:00`, value.replace(/\//g, "-")];

  for (const candidate of candidates) {
    const parsed = new Date(candidate);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return null;
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

/** Alias usado na geração de capa e portaria. */
export function formatEventDateLine(date?: string | null) {
  return formatEventDateLong(date);
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
  const start = startsAt?.trim();
  const end = endsAt?.trim();
  const timeLabel = start && end ? `${start}–${end}` : start || null;

  if (dateLabel && timeLabel) return `${dateLabel} · ${timeLabel}`;
  if (dateLabel) return dateLabel;
  if (timeLabel) return timeLabel;
  return "Data a confirmar";
}
