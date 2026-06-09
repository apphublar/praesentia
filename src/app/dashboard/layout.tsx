import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { requireSession } from "@/lib/auth/session";
import { repositories } from "@/lib/db";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();
  const events = await repositories.events.listByOwner(session.user.id);

  return (
    <div className="dashboard-shell">
      <DashboardSidebar events={events} />
      <div className="dashboard-shell-main">{children}</div>
    </div>
  );
}
