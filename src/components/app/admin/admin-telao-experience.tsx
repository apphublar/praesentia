"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Event, MediaItem } from "@/types/domain";
import { AdminExperienceLayout } from "@/components/app/admin/admin-experience-layout";
import { AdminScreenSettings } from "@/components/app/admin/admin-screen-settings";
import { PrototypeTelaoView, type TelaoDisplayOptions } from "@/components/app/guest/prototype-telao-view";
import { Icon } from "@/components/app/ui/icon";
import { ConfBlock } from "@/components/app/admin/conf-block";

export function AdminTelaoExperience({ event, items }: { event: Event; items: MediaItem[] }) {
  const [layout, setLayout] = useState<TelaoDisplayOptions["layout"]>("single");
  const [fit, setFit] = useState<TelaoDisplayOptions["fit"]>("contain");
  const [thumbs, setThumbs] = useState<TelaoDisplayOptions["thumbs"]>(6);
  const displayOptions = useMemo(() => ({ layout, fit, thumbs }), [fit, layout, thumbs]);
  const telaoHref = useMemo(() => {
    const query = new URLSearchParams({
      layout,
      fit,
      thumbs: String(thumbs)
    });
    return `/evento/${event.slug}/telao?${query.toString()}`;
  }, [event.slug, fit, layout, thumbs]);

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
          <ConfBlock title="Formato do telão" desc="Defina como as fotos aparecem na área principal e nas miniaturas laterais.">
            <div className="card" style={{ padding: 14, display: "grid", gap: 12 }}>
              <label className="field" style={{ margin: 0 }}>
                <span>Layout principal</span>
                <select
                  value={layout}
                  onChange={(event) => setLayout(event.target.value as TelaoDisplayOptions["layout"])}
                  className="select"
                >
                  <option value="single">1 foto grande</option>
                  <option value="double">2 fotos lado a lado</option>
                  <option value="triple">3 fotos lado a lado</option>
                  <option value="hero_two">1 grande + 2 ao lado</option>
                </select>
              </label>
              <label className="field" style={{ margin: 0 }}>
                <span>Ajuste da imagem</span>
                <select value={fit} onChange={(event) => setFit(event.target.value as TelaoDisplayOptions["fit"])} className="select">
                  <option value="contain">Mostrar imagem inteira (sem cortar)</option>
                  <option value="cover">Preencher bloco (pode cortar)</option>
                </select>
              </label>
              <label className="field" style={{ margin: 0 }}>
                <span>Miniaturas em "Chegando agora"</span>
                <select
                  value={thumbs}
                  onChange={(event) => setThumbs(Number(event.target.value) as TelaoDisplayOptions["thumbs"])}
                  className="select"
                >
                  <option value={4}>4 fotos</option>
                  <option value={6}>6 fotos</option>
                  <option value={8}>8 fotos</option>
                </select>
              </label>
            </div>
          </ConfBlock>
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
          <PrototypeTelaoView event={event} initialItems={items} embedded displayOptions={displayOptions} />
        </div>
      }
    />
  );
}
