import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { requirePageSession } from "@/lib/auth/session";
import { repositories } from "@/lib/db";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await requirePageSession("/dashboard");
  const events = await repositories.events.listByOwner(session.user.id);

  return (
    <DashboardShell user={session.user} events={events}>
      {children}
    </DashboardShell>
  );
}
