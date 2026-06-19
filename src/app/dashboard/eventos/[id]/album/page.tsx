import Link from "next/link";
import { AdminPhotoAlbumExperience } from "@/components/app/admin/admin-photo-album-experience";
import { loadManagedEventPage } from "@/lib/app/load-managed-event";
import { repositories } from "@/lib/db";
import { safeRepositoryCall } from "@/lib/db/safe";
import { hasCapsuleAccess } from "@/lib/plans/features";

export default async function AdminPhotoAlbumPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const loginNext = `/dashboard/eventos/${id}/album`;
  const { event } = await loadManagedEventPage(id, loginNext);

  if (!hasCapsuleAccess(event)) {
    return (
      <div style={{ padding: "32px", maxWidth: 520 }}>
        <h1 className="serif-i" style={{ fontSize: 28, marginTop: 0 }}>
          Álbum indisponível
        </h1>
        <p style={{ color: "var(--muted)", lineHeight: 1.55 }}>
          Ative a Cápsula do Tempo no painel do evento para montar o álbum impresso com as memórias do evento.
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

  const order = await safeRepositoryCall(
    () => repositories.photoAlbumOrders.findByEventId(event.id),
    null,
    "photoAlbumOrders.findByEventId"
  );

  return <AdminPhotoAlbumExperience event={event} media={media} initialOrder={order} />;
}
