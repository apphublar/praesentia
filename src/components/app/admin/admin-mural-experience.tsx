"use client";

import Link from "next/link";
import type { Event, MediaItem } from "@/types/domain";
import { AdminExperienceLayout } from "@/components/app/admin/admin-experience-layout";
import { AdminMuralPanel } from "@/components/app/admin/admin-mural-panel";
import { Icon } from "@/components/app/ui/icon";
import { MuralAccessPanel } from "@/components/event/mural-access-panel";
import { getSchedulePhase } from "@/lib/mural/timeline";

export function AdminMuralExperience({ event, items }: { event: Event; items: MediaItem[] }) {
  const schedule = getSchedulePhase(event);
  const guestHref = `/evento/${event.slug}/mural`;

  return (
    <AdminExperienceLayout
      title="Mural ao vivo"
      subtitle="Aprove pedidos de acesso, modere o conteúdo e veja como o convidado entra no mural."
      previewDark
      actions={
        <Link className="btn btn-dark btn-sm" href={guestHref} target="_blank" rel="noreferrer">
          <Icon name="eye" size={15} />
          Link do convidado
        </Link>
      }
      config={<AdminMuralPanel event={event} items={items} layout="stack" showTelaoLink={false} />}
      preview={
        schedule === "live" ? (
          <MuralAccessPanel eventId={event.id} capsuleActive eventTitle={event.title} mode="live" />
        ) : (
          <div className="admin-preview-placeholder">
            <Icon name="camera" size={28} style={{ color: "var(--coral)", marginBottom: 12 }} />
            <p className="serif-i" style={{ fontSize: 18, margin: "0 0 8px" }}>
              O mural abre no dia do evento
            </p>
            <p style={{ margin: 0, fontSize: 13, color: "rgba(244,237,223,.55)", lineHeight: 1.5 }}>
              Antes da festa, o convidado vê o convite. No dia, esta tela de acesso aparece aqui.
            </p>
          </div>
        )
      }
    />
  );
}
