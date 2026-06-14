import Link from "next/link";
import { AdminMuralExperience } from "@/components/app/admin/admin-mural-experience";
import { loadManagedEventPage } from "@/lib/app/load-managed-event";
import { repositories } from "@/lib/db";
import { safeRepositoryCall } from "@/lib/db/safe";
import { hasCapsuleAccess } from "@/lib/plans/features";

export default async function AdminMuralPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const loginNext = `/dashboard/eventos/${id}/mural`;
  const { event } = await loadManagedEventPage(id, loginNext);

  if (!hasCapsuleAccess(event)) {
    return (
      <div style={{ padding: "32px", maxWidth: 520 }}>
        <h1 className="serif-i" style={{ fontSize: 28, marginTop: 0 }}>
          Mural indisponível
        </h1>
        <p style={{ color: "var(--muted)", lineHeight: 1.55 }}>
          Ative a Cápsula no painel do evento para liberar mural, telão e cápsula do tempo.
        </p>
        <Link className="btn btn-coral" href={`/dashboard/eventos/${id}`}>
          Voltar ao painel
        </Link>
      </div>
    );
  }

  const media = await safeRepositoryCall(
    () => repositories.media.listPublishedByEvent(event.id),
    [],
    "media.listPublishedByEvent"
  );

  return <AdminMuralExperience event={event} items={media} />;
}
