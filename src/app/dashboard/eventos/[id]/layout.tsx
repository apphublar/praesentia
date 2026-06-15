import { notFound } from "next/navigation";
import { DashboardEventProvider } from "@/components/dashboard/dashboard-context";
import { DashboardHashScroll } from "@/components/dashboard/dashboard-hash-scroll";
import { toDashboardEventSummary } from "@/components/dashboard/dashboard-event-summary";
import { getCachedEventById } from "@/lib/db/cached-queries";

export default async function EventDashboardLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const event = await getCachedEventById(id);
  if (!event) notFound();

  return (
    <DashboardEventProvider event={toDashboardEventSummary(event)}>
      <DashboardHashScroll />
      {children}
    </DashboardEventProvider>
  );
}
