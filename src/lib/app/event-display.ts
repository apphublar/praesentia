import type { Event, GuestRsvp } from "@/types/domain";
import { hasCapsuleAccess } from "@/lib/plans/features";
import { parseEventDateTime } from "@/lib/events/datetime";
import { PASTELS, TAPE_COLORS } from "@/components/app/ui/primitives";

export type DashboardCardPhase = "convite" | "confirmacoes" | "ao-vivo" | "capsula" | "encerrado";

export type AdminPhaseLineId = "convite" | "confirmacao" | "festa" | "capsula";

export const PHASE_META: Record<
  DashboardCardPhase,
  { label: string; color: string; live?: boolean }
> = {
  convite: { label: "Antes · convite", color: "var(--amber)" },
  confirmacoes: { label: "Confirmações abertas", color: "var(--amber)" },
  "ao-vivo": { label: "Ao vivo agora", color: "var(--coral)", live: true },
  capsula: { label: "Cápsula ativa", color: "#7d9a6f" },
  encerrado: { label: "Encerrado", color: "var(--faint)" }
};

export function pastelForEvent(eventId: string) {
  let hash = 0;
  for (let i = 0; i < eventId.length; i++) hash = (hash + eventId.charCodeAt(i) * (i + 1)) % 997;
  return {
    cover: PASTELS[hash % PASTELS.length],
    tape: TAPE_COLORS[hash % TAPE_COLORS.length]
  };
}

export function formatEventCardDate(date: string, startsAt: string) {
  const instant = parseEventDateTime(date, startsAt);
  if (!instant) return date;
  const formatted = instant.toLocaleDateString("pt-BR", { day: "numeric", month: "short", year: "numeric" });
  const today = new Date();
  const sameDay =
    instant.getFullYear() === today.getFullYear() &&
    instant.getMonth() === today.getMonth() &&
    instant.getDate() === today.getDate();
  return sameDay ? `${formatted} · hoje` : formatted;
}

export function getDashboardCardPhase(event: Event, rsvpStats?: { confirmed: number; total: number }): DashboardCardPhase {
  const now = Date.now();
  const start = parseEventDateTime(event.date, event.startsAt)?.getTime();
  const end = parseEventDateTime(event.date, event.endsAt)?.getTime();
  const capsule = hasCapsuleAccess(event);

  if (end && now > end) {
    if (capsule) return "capsula";
    return "encerrado";
  }
  if (start && end && now >= start && now <= end && capsule) return "ao-vivo";
  if (event.rsvpEnabled && event.rsvpDeadline) {
    const deadline = parseEventDateTime(event.rsvpDeadline, "23:59")?.getTime();
    if (deadline && now <= deadline && (rsvpStats?.total ?? 0) > 0) return "confirmacoes";
  }
  if (capsule && end && now > end) return "capsula";
  return "convite";
}

export function getAdminPhaseLineCurrent(event: Event): AdminPhaseLineId {
  const phase = getDashboardCardPhase(event);
  if (phase === "confirmacoes") return "confirmacao";
  if (phase === "ao-vivo") return "festa";
  if (phase === "capsula" || phase === "encerrado") return "capsula";
  return "convite";
}

export function getEventMetricLabel(
  phase: DashboardCardPhase,
  rsvps: GuestRsvp[],
  mediaCount: number
): string {
  const confirmed = rsvps.filter((r) => r.rsvpStatus === "confirmed");
  const declined = rsvps.filter((r) => r.rsvpStatus === "declined");
  const checkedIn = confirmed.filter((r) => r.checkedInAt).length;
  const people = confirmed.reduce(
    (sum, r) => sum + 1 + (r.companionsDetail?.length ?? r.companionNames?.length ?? (r.companionName ? 1 : 0)),
    0
  );

  if (phase === "ao-vivo") return `${checkedIn || people} presentes`;
  if (phase === "capsula") return `${mediaCount} memórias`;
  if (phase === "encerrado") return "arquivado";
  if (confirmed.length > 0 || declined.length > 0) {
    return `${confirmed.length} confirmados`;
  }
  return "sem confirmações";
}

export function eventDashboardHref(event: Event, phase: DashboardCardPhase) {
  if (phase === "ao-vivo" && hasCapsuleAccess(event)) return `/evento/${event.slug}/telao`;
  if (phase === "capsula" && hasCapsuleAccess(event)) return `/evento/${event.slug}/capsula`;
  return `/dashboard/eventos/${event.id}`;
}
