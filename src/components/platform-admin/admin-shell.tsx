"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { User } from "@/types/domain";
import { ADMIN_NAV } from "@/lib/admin/constants";
import { PraesentiaLogo } from "@/components/brand/praesentia-logo";

export function AdminShell({ user, children }: { user: User; children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="platform-admin">
      <aside className="platform-admin-sidebar">
        <div className="platform-admin-brand">
          <PraesentiaLogo href="/admin" variant="dark" markHeight={36} wordmarkSize={20} withTape withShadow={false} />
          <p className="mono">super admin</p>
        </div>
        <nav className="platform-admin-nav">
          {ADMIN_NAV.map((item) => {
            const active = "exact" in item && item.exact ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href} className={active ? "is-active" : undefined}>
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="platform-admin-sidebar-foot">
          <p>{user.name}</p>
          <span>{user.email}</span>
          <Link href="/dashboard">Ir ao dashboard</Link>
        </div>
      </aside>
      <div className="platform-admin-main">
        <header className="platform-admin-topbar">
          <div>
            <p className="mono">Operação Praesentia</p>
            <h1>Painel do controlador</h1>
          </div>
          <Link className="btn btn-dark" href="/">Ver site</Link>
        </header>
        <div className="platform-admin-content">{children}</div>
      </div>
    </div>
  );
}
