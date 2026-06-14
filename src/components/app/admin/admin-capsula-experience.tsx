"use client";

import Link from "next/link";
import type { Event, MediaItem } from "@/types/domain";
import { AdminExperienceLayout } from "@/components/app/admin/admin-experience-layout";
import { ConfBlock } from "@/components/app/admin/conf-block";
import { CapsulaOpen } from "@/components/app/guest/prototype-capsula-view";
import { Icon } from "@/components/app/ui/icon";
import { RETENTION_CAPSULE_DESCRIPTION } from "@/lib/copy/retention";
import { getSchedulePhase } from "@/lib/mural/timeline";

export function AdminCapsulaExperience({
  event,
  media,
  confirmedGuestCount
}: {
  event: Event;
  media: MediaItem[];
  confirmedGuestCount: number;
}) {
  const phase = getSchedulePhase(event);
  const guestHref = `/evento/${event.slug}/capsula`;
  const hasMemories = media.length > 0;

  return (
    <AdminExperienceLayout
      title="Cápsula do tempo"
      subtitle="Revise as memórias compartilhadas. Convidados precisam de código para acessar."
      actions={
        <Link className="btn btn-dark btn-sm" href={guestHref} target="_blank" rel="noreferrer">
          <Icon name="eye" size={15} />
          Link do convidado
        </Link>
      }
      config={
        <ConfBlock title="Acesso dos convidados" desc="Depois do evento, convidados entram com o código enviado por e-mail.">
          <p style={{ margin: "0 0 14px", fontSize: 13.5, color: "var(--muted)", lineHeight: 1.55 }}>
            {RETENTION_CAPSULE_DESCRIPTION}
          </p>
          <div
            className="card"
            style={{
              padding: "14px 16px",
              display: "flex",
              alignItems: "center",
              gap: 12,
              flexWrap: "wrap"
            }}
          >
            <code style={{ flex: 1, fontSize: 12.5, wordBreak: "break-all", color: "var(--ink-2)" }}>{guestHref}</code>
            <Link className="btn btn-dark btn-sm" href={guestHref} target="_blank" rel="noreferrer">
              Abrir
            </Link>
          </div>
        </ConfBlock>
      }
      preview={
        phase === "before" ? (
          <div className="admin-preview-placeholder is-light">
            <Icon name="hourglass" size={28} style={{ color: "var(--coral-deep)", marginBottom: 12 }} />
            <p className="serif-i" style={{ fontSize: 18, margin: "0 0 8px", color: "var(--ink)" }}>
              Ainda guardada
            </p>
            <p style={{ margin: 0, fontSize: 13, color: "var(--muted)", lineHeight: 1.5 }}>
              As memórias aparecerão aqui depois do evento. Convidados verão a tela de acesso com código.
            </p>
          </div>
        ) : hasMemories ? (
          <CapsulaOpen event={event} media={media} confirmedGuestCount={confirmedGuestCount} />
        ) : (
          <div className="admin-preview-placeholder is-light">
            <Icon name="camera" size={28} style={{ color: "var(--muted)", marginBottom: 12 }} />
            <p className="serif-i" style={{ fontSize: 18, margin: "0 0 8px", color: "var(--ink)" }}>
              Nenhuma memória ainda
            </p>
            <p style={{ margin: 0, fontSize: 13, color: "var(--muted)", lineHeight: 1.5 }}>
              Quando convidados compartilharem fotos e recados, eles aparecerão aqui.
            </p>
          </div>
        )
      }
    />
  );
}
