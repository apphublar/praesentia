import { notFound } from "next/navigation";
import { DashboardEventProvider } from "@/components/dashboard/dashboard-context";
import { toDashboardEventSummary } from "@/components/dashboard/dashboard-event-summary";
import { repositories } from "@/lib/db";

export default async function EventDashboardLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const event = await repositories.events.findById(id);
  if (!event) notFound();

  return <DashboardEventProvider event={toDashboardEventSummary(event)}>{children}</DashboardEventProvider>;
}
