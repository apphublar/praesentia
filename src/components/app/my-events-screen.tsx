"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Event, GuestRsvp } from "@/types/domain";
import { Icon } from "@/components/app/ui/icon";
import { Mono, Segmented, StripePhoto, Tag } from "@/components/app/ui/primitives";
import { CREATE_EVENT_PATH } from "@/lib/auth/routes";
import {
  PHASE_META,
  eventDashboardHref,
  formatEventCardDate,
  getDashboardCardPhase,
  getEventMetricLabel,
  pastelForEvent,
  type DashboardCardPhase
} from "@/lib/app/event-display";
import { EVENT_TYPE_LABELS } from "@/lib/events/event-types";
import { hasCapsuleAccess } from "@/lib/plans/features";

export type EventListItem = {
  event: Event;
  rsvps: GuestRsvp[];
  mediaCount: number;
};

const FILTERS = ["Todos", "Ativos", "Cápsulas", "Encerrados"] as const;
type Filter = (typeof FILTERS)[number];

function matchesFilter(phase: DashboardCardPhase, capsule: boolean, filter: Filter) {
  if (filter === "Ativos") return ["convite", "confirmacoes", "ao-vivo"].includes(phase);
  if (filter === "Cápsulas") return capsule;
  if (filter === "Encerrados") return phase === "encerrado";
  return true;
}

function EventCard({ item, index }: { item: EventListItem; index: number }) {
  const { event, rsvps, mediaCount } = item;
  const phase = getDashboardCardPhase(event, {
    confirmed: rsvps.filter((r) => r.rsvpStatus === "confirmed").length,
    total: rsvps.length
  });
  const ph = PHASE_META[phase];
  const { cover, tape } = pastelForEvent(event.id);
  const capsule = hasCapsuleAccess(event);
  const href = eventDashboardHref(event, phase);

  return (
    <Link href={href} className="evcard" style={{ textAlign: "left", padding: 0, border: "none", background: "transparent", cursor: "pointer", textDecoration: "none" }}>
      <div className="card" style={{ overflow: "hidden", height: "100%", transition: "transform .18s, box-shadow .18s" }}>
        <div style={{ position: "relative", padding: "22px 18px 16px", background: cover }}>
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage: "repeating-linear-gradient(135deg,rgba(255,255,255,.35) 0 1.5px,transparent 1.5px 12px)"
            }}
          />
          <div className="tape" style={{ background: tape, top: -8, left: 24, transform: "rotate(-4deg)" }} />
          <div style={{ position: "relative", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <Tag kind={capsule ? "cap" : "free"} style={{ background: capsule ? "rgba(255,255,255,.85)" : "rgba(255,255,255,.7)" }}>
              {capsule ? "Cápsula" : "Gratuito"}
            </Tag>
          </div>
          <div
            className="serif-i"
            style={{
              position: "relative",
              fontSize: 23,
              fontWeight: 600,
              color: "#2a241c",
              marginTop: 30,
              lineHeight: 1.05
            }}
          >
            {event.title}
          </div>
        </div>
        <div style={{ padding: "14px 18px 18px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--muted)", fontSize: 12.5, marginBottom: 8 }}>
            <Icon name="calendar" size={14} />
            {formatEventCardDate(event.date, event.startsAt)}
          </div>
          <p style={{ margin: "0 0 12px", fontSize: 12, color: "var(--faint)" }}>{EVENT_TYPE_LABELS[event.eventType]}</p>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                fontFamily: "var(--font-mono)",
                fontSize: 10,
                textTransform: "uppercase",
                letterSpacing: ".1em",
                color: ph.color,
                fontWeight: 700
              }}
            >
              <span className={ph.live ? "pulse" : ""} style={{ width: 7, height: 7, borderRadius: 99, background: ph.color }} />
              {ph.label}
            </span>
            <span style={{ fontSize: 12.5, color: "var(--ink-2)", fontWeight: 600, textAlign: "right", minWidth: 0, overflowWrap: "anywhere" }}>{getEventMetricLabel(phase, rsvps, mediaCount)}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export function MyEventsScreen({ userName, items }: { userName: string; items: EventListItem[] }) {
  const [filter, setFilter] = useState<Filter>("Todos");
  const [query, setQuery] = useState("");

  const list = useMemo(() => {
    return items.filter(({ event, rsvps }) => {
      const phase = getDashboardCardPhase(event);
      const capsule = hasCapsuleAccess(event);
      if (!matchesFilter(phase, capsule, filter)) return false;
      if (query.trim() && !event.title.toLowerCase().includes(query.trim().toLowerCase())) return false;
      return true;
    });
  }, [items, filter, query]);

  return (
    <div className="scroll my-events-page" style={{ height: "100%", overflow: "auto", background: "var(--paper)" }}>
      <div className="my-events-header">
          <div>
            <Mono>Olá, {userName.split(" ")[0]}</Mono>
            <h1 className="display my-events-title">
              <span className="my-events-title-line">
                Seus <span className="coral">momentos</span>.
              </span>
            </h1>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="card" style={{ padding: 40, textAlign: "center" }}>
            <h2 className="serif-i" style={{ fontSize: 28, marginBottom: 10 }}>
              Nenhum evento ainda
            </h2>
            <p style={{ color: "var(--muted)", marginBottom: 22, lineHeight: 1.5 }}>
              Crie seu primeiro convite em um minuto. Depois você personaliza texto, arte e compartilha.
            </p>
            <Link className="btn btn-coral" href={CREATE_EVENT_PATH}>
              Criar evento grátis
            </Link>
          </div>
        ) : (
          <>
            <div className="my-events-toolbar">
              <Segmented options={[...FILTERS]} value={filter} onChange={setFilter} />
              <div className="card-flat my-events-search">
                <Icon name="search" size={15} style={{ color: "var(--muted)", flexShrink: 0 }} />
                <input
                  placeholder="Buscar evento…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="app-events-grid">
              {list.map((item, i) => (
                <EventCard key={item.event.id} item={item} index={i} />
              ))}
              <Link
                href={CREATE_EVENT_PATH}
                className="newev"
                style={{
                  minHeight: 240,
                  borderRadius: 20,
                  border: "2px dashed var(--line-2)",
                  background: "transparent",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 12,
                  color: "var(--muted)",
                  transition: "all .15s",
                  textDecoration: "none"
                }}
              >
                <span
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: 99,
                    background: "var(--card)",
                    border: "1px solid var(--line)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  <Icon name="plus" size={22} />
                </span>
                <span style={{ fontWeight: 600, fontSize: 14 }}>Novo evento</span>
              </Link>
            </div>
          </>
        )}
    </div>
  );
}
