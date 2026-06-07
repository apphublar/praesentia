import { notFound } from "next/navigation";
import { LiveScreen } from "@/components/screen/live-screen";
import { repositories } from "@/lib/db";

export default async function ScreenPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = await repositories.events.findBySlugOrCode(slug);
  if (!event) notFound();

  return <LiveScreen event={event} initialItems={await repositories.media.listPublishedByEvent(event.id)} />;
}
