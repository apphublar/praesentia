import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { toDashboardEventSummary } from "@/components/dashboard/dashboard-event-summary";
import { requirePageSession } from "@/lib/auth/session";
import { repositories } from "@/lib/db";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await requirePageSession("/dashboard");
  const events = await repositories.events.listByOwner(session.user.id);

  return (
    <DashboardShell user={session.user} events={events.map(toDashboardEventSummary)}>
      {children}
    </DashboardShell>
  );
}
