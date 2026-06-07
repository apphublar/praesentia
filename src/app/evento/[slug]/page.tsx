import { notFound } from "next/navigation";
import { EventExperience } from "@/components/event/event-experience";
import { AppNav } from "@/components/layout/app-nav";
import { getCurrentSession } from "@/lib/auth/session";
import { repositories } from "@/lib/db";

export default async function EventPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = await repositories.events.findBySlugOrCode(slug);
  if (!event) notFound();

  const media = await repositories.media.listPublishedByEvent(event.id);
  const session = await getCurrentSession();

  return (
    <>
      <AppNav />
      <EventExperience event={event} media={media} currentUserId={session?.user.id} />
    </>
  );
}
