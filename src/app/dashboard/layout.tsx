import { AppShell } from "@/components/app/app-shell";
import { requirePageSession } from "@/lib/auth/session";
import { getCachedEventsByOwner } from "@/lib/db/cached-queries";
import "@/styles/praesentia-app.css";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await requirePageSession("/dashboard");
  const events = await getCachedEventsByOwner(session.user.id);

  return (
    <div className="praesentia-app">
      <AppShell user={session.user} events={events}>
        {children}
      </AppShell>
    </div>
  );
}
