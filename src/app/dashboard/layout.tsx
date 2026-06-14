import { AppShell } from "@/components/app/app-shell";
import { requirePageSession } from "@/lib/auth/session";
import { repositories } from "@/lib/db";
import { safeRepositoryCall } from "@/lib/db/safe";
import "@/styles/praesentia-app.css";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await requirePageSession("/dashboard");
  const events = await safeRepositoryCall(
    () => repositories.events.listByOwner(session.user.id),
    [],
    "events.listByOwner"
  );

  return (
    <div className="praesentia-app">
      <AppShell user={session.user} events={events}>
        {children}
      </AppShell>
    </div>
  );
}
