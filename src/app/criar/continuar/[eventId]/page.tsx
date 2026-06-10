import { redirect } from "next/navigation";
import { createEventContinuePath } from "@/lib/auth/routes";

export default async function ContinueLegacyRedirectPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  redirect(createEventContinuePath(eventId));
}
