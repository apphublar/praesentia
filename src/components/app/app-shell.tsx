"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import type { Event, User } from "@/types/domain";
import { Icon } from "@/components/app/ui/icon";
import { Avatar, Mono } from "@/components/app/ui/primitives";
import {
  buildAppNavGroups,
  isAppNavItemActive,
  isAppNavItemDisabled,
  isAppNavItemLocked,
  type AppNavItem
} from "@/lib/app/app-nav-config";
import { PraesentiaLogo } from "@/components/brand/praesentia-logo";

function NavLink({
  item,
  event,
  pathname,
  compact,
  onLogout
}: {
  item: AppNavItem;
  event: Event | null;
  pathname: string;
  compact?: boolean;
  onLogout: () => void;
}) {
  const on = isAppNavItemActive(item, pathname, event);
  const locked = isAppNavItemLocked(item, event);
  const disabled = isAppNavItemDisabled(item, event);
  const href = disabled ? "#" : item.href;
  const isLogout = item.id === "sair";

  const content = (
    <>
      <Icon
        name={item.icon}
        size={compact ? 20 : 17}
        style={{ color: on ? "var(--coral)" : isLogout ? "var(--coral-deep)" : locked || disabled ? "var(--faint)" : "var(--muted)", flexShrink: 0 }}
      />
      {!compact ? <span style={{ flex: 1, fontWeight: on ? 700 : 500, fontSize: 13.5 }}>{item.name}</span> : null}
      {locked ? <Icon name="lock" size={13} style={{ color: "var(--faint)" }} /> : null}
      {on && !compact ? <span style={{ width: 5, height: 5, borderRadius: 99, background: "var(--coral)" }} /> : null}
    </>
  );

  const baseStyle = {
    display: "flex",
    gap: compact ? 0 : 11,
    alignItems: "center",
    justifyContent: compact ? "center" : "flex-start",
    flexDirection: compact ? "column" : "row",
    width: "100%",
    border: "none",
    cursor: disabled ? "not-allowed" : "pointer",
    borderRadius: 11,
    padding: compact ? "6px 4px" : "10px 10px",
    textAlign: compact ? "center" : "left",
    marginBottom: compact ? 0 : 2,
    background: on ? "var(--ink)" : "transparent",
    color: on ? "var(--paper)" : isLogout ? "var(--coral-deep)" : locked ? "var(--faint)" : "var(--ink-2)",
    textDecoration: "none",
    fontSize: compact ? 11 : undefined,
    fontWeight: compact ? (on ? 700 : 500) : undefined
  } as const;

  if (disabled) {
    return (
      <span className="navitem" aria-disabled="true" title="Crie ou selecione um evento primeiro" style={{ ...baseStyle, opacity: 0.55 }}>
        {content}
      </span>
    );
  }

  if (isLogout) {
    return (
      <button type="button" className="navitem is-logout navitem-button" style={baseStyle} onClick={onLogout}>
        {content}
        {compact ? <span style={{ fontSize: 10.5, lineHeight: 1.2 }}>{item.name.split(" ")[0]}</span> : null}
      </button>
    );
  }

  return (
    <Link href={href} className={`navitem${isLogout ? " is-logout" : ""}`} style={baseStyle}>
      {content}
      {compact ? <span style={{ fontSize: 10.5, lineHeight: 1.2 }}>{item.name.split(" ")[0]}</span> : null}
    </Link>
  );
}

export function AppShell({ user, events, children }: { user: User; events: Event[]; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      void navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
          void registration.unregister();
        }
      });
    }
  }, []);

  const activeEvent = useMemo(() => {
    const fromPath = pathname.match(/\/dashboard\/eventos\/([^/]+)/)?.[1];
    if (fromPath) {
      const match = events.find((event) => event.id === fromPath);
      if (match) return match;
    }
    return events[0] ?? null;
  }, [events, pathname]);

  const navGroups = useMemo(() => buildAppNavGroups(activeEvent), [activeEvent]);
  const organizerNav = navGroups.find((group) => group.label === "Organizador")?.items ?? [];
  const accountNav = navGroups.find((group) => group.label === "Conta")?.items ?? [];
  const mobileNav = [...organizerNav, ...accountNav.filter((item) => item.id !== "sair")];

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" });
    router.replace("/login");
    router.refresh();
  }

  return (
    <div className="app-shell">
      <aside className="app-rail">
        <PraesentiaLogo
          href="/dashboard"
          className="app-rail-brand"
          markHeight={32}
          wordmarkSize={18}
          withTape
          withShadow={false}
        />

        <div style={{ padding: "0 22px 14px" }}>
          <span className="pill" style={{ fontSize: 9, maxWidth: "100%" }}>
            <span className="dot" />
            {activeEvent ? activeEvent.title : user.name.split(" ")[0]}
          </span>
        </div>

        <div className="scroll app-rail-nav" style={{ flex: 1, overflow: "auto", padding: "6px 14px 14px" }}>
          {navGroups.map((group) => (
            <div key={group.label} style={{ marginBottom: 18 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "0 8px 8px" }}>
                <Mono style={{ fontSize: 9.5 }}>{group.label}</Mono>
                {group.cap ? <Icon name="hourglass" size={11} style={{ color: "var(--coral-deep)" }} /> : null}
              </div>
              {group.items.map((item) => (
                <NavLink key={item.id} item={item} event={activeEvent} pathname={pathname} onLogout={handleLogout} />
              ))}
            </div>
          ))}
        </div>

        <div className="app-rail-account">
          <div className="app-rail-account-user">
            <Avatar name={user.name} size={34} />
            <div style={{ minWidth: 0 }}>
              <strong style={{ display: "block", fontSize: 13, lineHeight: 1.3 }}>{user.name}</strong>
              <span style={{ display: "block", fontSize: 11.5, color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {user.email}
              </span>
            </div>
          </div>
        </div>
      </aside>

      <div className="app-main">{children}</div>

      <nav className="app-bottom-nav" aria-label="Navegação principal">
        {mobileNav.map((item) => {
          const on = isAppNavItemActive(item, pathname, activeEvent);
          const disabled = isAppNavItemDisabled(item, activeEvent);
          if (disabled) {
            return (
              <span key={item.id} style={{ minWidth: 62, textAlign: "center", opacity: 0.45, color: "var(--faint)", fontSize: 11 }}>
                <Icon name={item.icon} size={20} />
                {item.name.split(" ")[0]}
              </span>
            );
          }
          return (
            <Link
              key={item.id}
              href={item.href}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 4,
                padding: "6px 4px",
                color: on ? "var(--coral-deep)" : "var(--muted)",
                fontSize: 11,
                fontWeight: on ? 700 : 500,
                textDecoration: "none",
                minWidth: 62
              }}
            >
              <Icon name={item.icon} size={20} />
              {item.name.split(" ")[0]}
            </Link>
          );
        })}
        <button type="button" className="app-bottom-nav-action is-logout" onClick={handleLogout} style={{ minWidth: 62 }}>
          <Icon name="logout" size={20} />
          Sair
        </button>
      </nav>
    </div>
  );
}
