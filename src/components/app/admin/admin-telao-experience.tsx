"use client";

import Link from "next/link";
import type { Event, MediaItem } from "@/types/domain";
import { AdminExperienceLayout } from "@/components/app/admin/admin-experience-layout";
import { AdminScreenSettings } from "@/components/app/admin/admin-screen-settings";
import { PrototypeTelaoView } from "@/components/app/guest/prototype-telao-view";
import { Icon } from "@/components/app/ui/icon";
import { ConfBlock } from "@/components/app/admin/conf-block";

export function AdminTelaoExperience({ event, items }: { event: Event; items: MediaItem[] }) {
  const telaoHref = `/evento/${event.slug}/telao`;

  return (
    <AdminExperienceLayout
      title="Telão"
      subtitle="Configure o que aparece na projeção e abra o telão em tela cheia na festa."
      previewWide
      previewDark
      previewLabel="Prévia do telão"
      actions={
        <Link className="btn btn-coral btn-sm" href={telaoHref} target="_blank" rel="noreferrer">
          <Icon name="proj" size={15} />
          Abrir telão em nova aba
        </Link>
      }
      config={
        <>
          <AdminScreenSettings event={event} />
          <ConfBlock title="Projetar na festa" desc="Use este link em um navegador conectado ao projetor ou TV.">
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
              <code style={{ flex: 1, fontSize: 12.5, wordBreak: "break-all", color: "var(--ink-2)" }}>{telaoHref}</code>
              <Link className="btn btn-dark btn-sm" href={telaoHref} target="_blank" rel="noreferrer">
                Abrir
              </Link>
            </div>
          </ConfBlock>
        </>
      }
      preview={
        <div className="guest-preview-telao">
          <PrototypeTelaoView event={event} initialItems={items} embedded />
        </div>
      }
    />
  );
}
