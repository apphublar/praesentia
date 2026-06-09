"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import type { Event } from "@/types/domain";
import { EVENT_TYPE_LABELS } from "@/lib/events/event-types";

export function DashboardSidebar({ events, currentEventId }: { events: Event[]; currentEventId?: string }) {
  const pathname = usePathname();
  const params = useParams();
  const activeEventId = currentEventId ?? (typeof params?.id === "string" ? params.id : undefined);

  return (
    <aside className="dashboard-sidebar">
      <div className="dashboard-sidebar-head">
        <span className="pill">meus eventos</span>
        <Link className="btn secondary dashboard-sidebar-create" href="/criar">
          + Criar evento
        </Link>
      </div>
      <nav className="dashboard-sidebar-nav" aria-label="Eventos do responsável">
        {events.map((event) => {
          const href = `/dashboard/eventos/${event.id}`;
          const active = activeEventId === event.id || pathname === href;
          return (
            <Link key={event.id} href={href} className={`dashboard-sidebar-link${active ? " is-active" : ""}`}>
              <strong>{event.title}</strong>
              <small>{EVENT_TYPE_LABELS[event.eventType] ?? event.eventType}</small>
            </Link>
          );
        })}
      </nav>
      <Link className="dashboard-sidebar-all" href="/dashboard">
        Ver todos os eventos
      </Link>
    </aside>
  );
}
