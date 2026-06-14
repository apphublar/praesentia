"use client";

import Link from "next/link";
import type { User } from "@/types/domain";
import { PraesentiaLogo } from "@/components/brand/praesentia-logo";
import { IconMenu } from "@/components/dashboard/dashboard-icons";

export function DashboardTopbar({
  user,
  onMenuToggle,
  sidebarOpen
}: {
  user: User;
  onMenuToggle: () => void;
  sidebarOpen: boolean;
}) {
  const initials = user.name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <header className="dashboard-topbar">
      <div className="dashboard-topbar-inner">
        <button type="button" className="dashboard-menu-btn" aria-expanded={sidebarOpen} aria-label="Abrir menu" onClick={onMenuToggle}>
          <IconMenu />
        </button>
        <PraesentiaLogo
          href="/dashboard"
          className="dashboard-topbar-brand"
          markHeight={32}
          wordmarkSize={18}
          withTape
          withShadow={false}
        />
        <div className="dashboard-topbar-user">
          <span className="dashboard-topbar-avatar" aria-hidden="true">
            {initials}
          </span>
          <span className="dashboard-topbar-name">{user.name.split(" ")[0]}</span>
        </div>
      </div>
    </header>
  );
}
