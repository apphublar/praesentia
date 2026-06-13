import { AppShell } from "@/components/app/app-shell";
import { requirePageSession } from "@/lib/auth/session";
import "@/styles/praesentia-app.css";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await requirePageSession("/dashboard");

  return (
    <div className="praesentia-app">
      <AppShell user={session.user}>{children}</AppShell>
    </div>
  );
}
