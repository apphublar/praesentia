"use client";

import { createContext, useContext } from "react";
import type { Event } from "@/types/domain";

type DashboardContextValue = {
  activeEvent: Event | null;
};

const DashboardContext = createContext<DashboardContextValue>({ activeEvent: null });

export function DashboardEventProvider({ event, children }: { event: Event; children: React.ReactNode }) {
  return <DashboardContext.Provider value={{ activeEvent: event }}>{children}</DashboardContext.Provider>;
}

export function useDashboardContext() {
  return useContext(DashboardContext);
}
