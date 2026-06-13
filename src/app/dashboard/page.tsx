import { MyEventsScreen, type EventListItem } from "@/components/app/my-events-screen";
import { requirePageSession } from "@/lib/auth/session";
import { repositories } from "@/lib/db";
import { safeRepositoryCall } from "@/lib/db/safe";

export default async function DashboardPage() {
  const session = await requirePageSession("/dashboard");
  const events = await safeRepositoryCall(
    () => repositories.events.listByOwner(session.user.id),
    [],
    "events.listByOwner"
  );

  const items: EventListItem[] = await Promise.all(
    events.map(async (event) => {
      const [rsvps, media] = await Promise.all([
        safeRepositoryCall(() => repositories.guestRsvps.listByEvent(event.id), [], "guestRsvps.listByEvent"),
        safeRepositoryCall(() => repositories.media.listPublishedByEvent(event.id), [], "media.listPublishedByEvent")
      ]);
      return { event, rsvps, mediaCount: media.length };
    })
  );

  return <MyEventsScreen userName={session.user.name} items={items} />;
}
