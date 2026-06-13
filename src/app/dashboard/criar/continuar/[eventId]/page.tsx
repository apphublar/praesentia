import { notFound, redirect } from "next/navigation";
import { CreateEventWizard } from "@/components/app/create-event-wizard";
import { requirePageSession } from "@/lib/auth/session";
import { repositories } from "@/lib/db";
import { getAiCoverQuota, getAiTextQuota } from "@/lib/plans/features";

export default async function DashboardContinueCreatePage({ params }: { params: Promise<{ eventId: string }> }) {
  const session = await requirePageSession("/dashboard/criar");
  const { eventId } = await params;
  const event = await repositories.events.findById(eventId);
  if (!event) notFound();

  const ownerId = await repositories.events.findOwnerId(event.id);
  if (ownerId !== session.user.id) redirect("/dashboard");

  const subscription = await repositories.subscriptions.findActiveByUser(session.user.id);

  return (
    <CreateEventWizard
      initialEvent={event}
      textQuota={getAiTextQuota(event)}
      coverQuota={getAiCoverQuota(event)}
      subscription={subscription}
    />
  );
}
