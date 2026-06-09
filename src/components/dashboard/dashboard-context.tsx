"use client";

import { createContext, useContext } from "react";
import type { DashboardEventSummary } from "@/components/dashboard/dashboard-event-summary";

type DashboardContextValue = {
  activeEvent: DashboardEventSummary | null;
};

const DashboardContext = createContext<DashboardContextValue>({ activeEvent: null });

export function DashboardEventProvider({
  event,
  children
}: {
  event: DashboardEventSummary;
  children: React.ReactNode;
}) {
  return <DashboardContext.Provider value={{ activeEvent: event }}>{children}</DashboardContext.Provider>;
}

export function useDashboardContext() {
  return useContext(DashboardContext);
}
