"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, usePathname } from "next/navigation";
import type { User } from "@/types/domain";
import type { DashboardEventSummary } from "@/components/dashboard/dashboard-event-summary";
import { EVENT_TYPE_LABELS } from "@/lib/events/event-types";
import { getEventProfile } from "@/lib/events/event-profile";
import { useDashboardContext } from "@/components/dashboard/dashboard-context";
import {
  IconCapsule,
  IconEvents,
  IconEye,
  IconHome,
  IconImage,
  IconLogout,
  IconPlus,
  IconScreen,
  IconSettings,
  IconShare,
  IconText,
  IconUsers
} from "@/components/dashboard/dashboard-icons";

type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
  hidden?: boolean;
};

function SidebarLink({
  href,
  label,
  icon,
  active,
  onNavigate
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  active: boolean;
  onNavigate: () => void;
}) {
  const isHash = href.includes("#");

  if (isHash) {
    return (
      <a href={href} className={`dashboard-nav-link${active ? " is-active" : ""}`} onClick={onNavigate}>
        <span className="dashboard-nav-icon">{icon}</span>
        <span>{label}</span>
      </a>
    );
  }

  return (
    <Link href={href} className={`dashboard-nav-link${active ? " is-active" : ""}`} onClick={onNavigate}>
      <span className="dashboard-nav-icon">{icon}</span>
      <span>{label}</span>
    </Link>
  );
}

export function DashboardSidebar({
  events,
  user,
  mobileOpen,
  onNavigate
}: {
  events: DashboardEventSummary[];
  user: User;
  mobileOpen: boolean;
  onNavigate: () => void;
}) {
  const pathname = usePathname();
  const params = useParams();
  const [hash, setHash] = useState("");
  const { activeEvent } = useDashboardContext();
  const routeEventId = typeof params?.id === "string" ? params.id : undefined;
  const event = activeEvent ?? events.find((item) => item.id === routeEventId) ?? null;
  const eventBase = event ? `/dashboard/eventos/${event.id}` : null;
  const profile = event ? getEventProfile(event.eventType) : null;

  useEffect(() => {
    const syncHash = () => setHash(window.location.hash);
    syncHash();
    window.addEventListener("hashchange", syncHash);
    return () => window.removeEventListener("hashchange", syncHash);
  }, [pathname]);

  const mainNav: NavItem[] = [
    { href: "/dashboard", label: "Meus eventos", icon: <IconEvents /> },
    { href: "/criar", label: "Criar novo evento", icon: <IconPlus /> }
  ];

  const eventNav: NavItem[] = eventBase
    ? [
        { href: eventBase, label: "Home do painel", icon: <IconHome /> },
        { href: `${eventBase}#secao-texto`, label: "Texto do convite", icon: <IconText /> },
        { href: `${eventBase}#secao-capa`, label: "Capa e imagem", icon: <IconImage /> },
        { href: `${eventBase}#secao-compartilhar`, label: "Compartilhar", icon: <IconShare /> },
        {
          href: `${eventBase}#secao-rsvp`,
          label: "Convidados (RSVP)",
          icon: <IconUsers />,
          hidden: !profile?.needsRsvp
        },
        { href: `${eventBase}#secao-configuracoes`, label: "Dados do evento", icon: <IconSettings /> },
        { href: `${eventBase}#secao-capsula`, label: "Cápsula e planos", icon: <IconCapsule /> },
        {
          href: `${eventBase}#secao-mural`,
          label: "Mural e mídias",
          icon: <IconScreen />,
          hidden: !event?.capsuleActivatedAt
        }
      ]
    : [];

  const footerNav: NavItem[] = event
    ? [
        { href: `/evento/${event.slug}`, label: "Ver site público", icon: <IconEye /> },
        { href: "/eu", label: "Meu perfil", icon: <IconSettings /> },
        { href: "/api/auth/logout", label: "Sair", icon: <IconLogout /> }
      ]
    : [{ href: "/api/auth/logout", label: "Sair", icon: <IconLogout /> }];

  function isActive(href: string) {
    if (href.includes("#")) {
      const [base, section] = href.split("#");
      return pathname === base && hash === `#${section}`;
    }
    if (eventBase && href === eventBase) {
      return pathname === href && !hash;
    }
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <aside className={`dashboard-sidebar${mobileOpen ? " is-open" : ""}`}>
      <div className="dashboard-sidebar-section">
        <p className="dashboard-sidebar-label">Painel</p>
        <nav className="dashboard-sidebar-nav" aria-label="Navegação principal">
          {mainNav.map((item) => (
            <SidebarLink key={item.href} {...item} active={isActive(item.href)} onNavigate={onNavigate} />
          ))}
        </nav>
      </div>

      {events.length > 0 ? (
        <div className="dashboard-sidebar-section">
          <p className="dashboard-sidebar-label">Seus eventos</p>
          <nav className="dashboard-sidebar-events" aria-label="Lista de eventos">
            {events.map((item) => (
              <Link
                key={item.id}
                href={`/dashboard/eventos/${item.id}`}
                className={`dashboard-event-chip${event?.id === item.id ? " is-active" : ""}`}
                onClick={onNavigate}
              >
                <strong>{item.title}</strong>
                <small>{EVENT_TYPE_LABELS[item.eventType] ?? item.eventType}</small>
              </Link>
            ))}
          </nav>
        </div>
      ) : null}

      {eventBase ? (
        <div className="dashboard-sidebar-section">
          <p className="dashboard-sidebar-label">Meu evento</p>
          <nav className="dashboard-sidebar-nav dashboard-sidebar-subnav" aria-label="Configurações do evento">
            {eventNav
              .filter((item) => !item.hidden)
              .map((item) => (
                <SidebarLink key={item.href} {...item} active={isActive(item.href)} onNavigate={onNavigate} />
              ))}
          </nav>
        </div>
      ) : null}

      <div className="dashboard-sidebar-section dashboard-sidebar-footer">
        <nav className="dashboard-sidebar-nav" aria-label="Conta e suporte">
          {footerNav.map((item) => (
            <SidebarLink key={item.href} {...item} active={false} onNavigate={onNavigate} />
          ))}
        </nav>
        <p className="dashboard-sidebar-user">{user.name}</p>
      </div>
    </aside>
  );
}
