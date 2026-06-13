"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import type { User } from "@/types/domain";
import { Icon, type IconName } from "@/components/app/ui/icon";
import { Mono } from "@/components/app/ui/primitives";
import { CREATE_EVENT_PATH } from "@/lib/auth/routes";

type NavItem = { href: string; name: string; icon: IconName };

const ORGANIZER_NAV: NavItem[] = [
  { href: "/dashboard", name: "Meus eventos", icon: "grid" },
  { href: CREATE_EVENT_PATH, name: "Criar evento", icon: "plus" }
];

export function AppShell({ user, children }: { user: User; children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    }
  }, []);

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  }

  return (
    <div className="app-shell">
      <aside className="app-rail">
        <div style={{ padding: "20px 22px 16px", display: "flex", alignItems: "center", gap: 10 }}>
          <span
            style={{
              width: 26,
              height: 26,
              borderRadius: 99,
              border: "1.5px solid var(--ink)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            <span style={{ width: 11, height: 11, borderRadius: 99, background: "var(--coral)" }} />
          </span>
          <span style={{ fontWeight: 700, fontSize: 17, letterSpacing: "-.01em" }}>Praesentia</span>
        </div>
        <div style={{ padding: "0 22px 14px" }}>
          <span className="pill" style={{ fontSize: 9 }}>
            <span className="dot" />
            {user.name.split(" ")[0]}
          </span>
        </div>

        <div className="scroll" style={{ flex: 1, overflow: "auto", padding: "6px 14px 14px" }}>
          <div style={{ marginBottom: 18 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "0 8px 8px" }}>
              <Mono style={{ fontSize: 9.5 }}>Organizador</Mono>
            </div>
            {ORGANIZER_NAV.map((item) => {
              const on = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="navitem"
                  style={{
                    display: "flex",
                    gap: 11,
                    alignItems: "center",
                    width: "100%",
                    border: "none",
                    cursor: "pointer",
                    borderRadius: 11,
                    padding: "10px 10px",
                    textAlign: "left",
                    marginBottom: 2,
                    background: on ? "var(--ink)" : "transparent",
                    color: on ? "var(--paper)" : "var(--ink-2)",
                    textDecoration: "none"
                  }}
                >
                  <Icon
                    name={item.icon}
                    size={17}
                    style={{ color: on ? "var(--coral)" : "var(--muted)", flexShrink: 0 }}
                  />
                  <span style={{ flex: 1, fontWeight: on ? 700 : 500, fontSize: 13.5 }}>{item.name}</span>
                  {on ? <span style={{ width: 5, height: 5, borderRadius: 99, background: "var(--coral)" }} /> : null}
                </Link>
              );
            })}
          </div>
        </div>

        <div style={{ padding: 16, borderTop: "1px solid var(--line)" }}>
          <Mono style={{ display: "block", marginBottom: 9, fontSize: 9 }}>Conta</Mono>
          <p style={{ margin: 0, fontSize: 12, color: "var(--ink-2)", lineHeight: 1.4 }}>{user.email}</p>
        </div>
      </aside>

      <div className="app-main">{children}</div>

      <nav className="app-bottom-nav" aria-label="Navegação principal">
        {ORGANIZER_NAV.map((item) => {
          const on = isActive(item.href);
          return (
            <Link
              key={item.href}
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
                textDecoration: "none"
              }}
            >
              <Icon name={item.icon} size={20} />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
