import { MyEventsScreen } from "@/components/app/my-events-screen";
import { loadDashboardEventItems } from "@/lib/app/load-dashboard-events";
import { requirePageSession } from "@/lib/auth/session";
import { getCachedEventsByOwner } from "@/lib/db/cached-queries";

export default async function DashboardPage() {
  const session = await requirePageSession("/dashboard");
  const events = await getCachedEventsByOwner(session.user.id);
  const items = await loadDashboardEventItems(events);

  return <MyEventsScreen userName={session.user.name} items={items} />;
}
