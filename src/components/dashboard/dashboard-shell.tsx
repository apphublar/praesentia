"use client";

import { useState } from "react";
import type { Event, User } from "@/types/domain";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { DashboardTopbar } from "@/components/dashboard/dashboard-topbar";

export function DashboardShell({
  user,
  events,
  children
}: {
  user: User;
  events: Event[];
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="dashboard-app">
      <DashboardTopbar user={user} onMenuToggle={() => setSidebarOpen((open) => !open)} sidebarOpen={sidebarOpen} />
      <div className="dashboard-shell">
        <DashboardSidebar events={events} user={user} mobileOpen={sidebarOpen} onNavigate={() => setSidebarOpen(false)} />
        <div className="dashboard-shell-main">{children}</div>
      </div>
      {sidebarOpen ? <button type="button" className="dashboard-overlay" aria-label="Fechar menu" onClick={() => setSidebarOpen(false)} /> : null}
    </div>
  );
}
