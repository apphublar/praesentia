import { redirect } from "next/navigation";
import { AdminShell } from "@/components/platform-admin/admin-shell";
import { isPlatformAdmin, requirePageSession } from "@/lib/auth/session";
import "@/styles/praesentia-app.css";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requirePageSession("/admin");
  if (!isPlatformAdmin(session.user)) {
    redirect("/dashboard");
  }

  return (
    <div className="praesentia-app">
      <AdminShell user={session.user}>{children}</AdminShell>
    </div>
  );
}
