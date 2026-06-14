"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import type { Event, GuestRsvp, UserSubscription } from "@/types/domain";
import { ExpandStorageModal } from "@/components/app/expand-storage-modal";
import { PhaseLine } from "@/components/app/admin/phase-line";
import { Icon, type IconName } from "@/components/app/ui/icon";
import { Avatar, LockedCapsuleView, Mono, PASTELS, StripePhoto, Tag } from "@/components/app/ui/primitives";
import { PlanUpgradePanel } from "@/components/dashboard/plan-upgrade-panel";
import { InviteAiQuotaPanel } from "@/components/dashboard/invite-ai-quota-panel";
import type { CoverQuota } from "@/components/dashboard/cover-generator";
import { formatEventCardDate, getAdminPhaseLineCurrent } from "@/lib/app/event-display";
import { hasCapsuleAccess } from "@/lib/plans/features";
import { buildStorageSnapshot } from "@/lib/storage/quota";

type TabId = "visao" | "convidados" | "checkin" | "mural" | "config";

const TABS: { id: TabId; label: string; icon: IconName; capsuleOnly?: boolean }[] = [
  { id: "visao", label: "Visão geral", icon: "grid" },
  { id: "convidados", label: "Convidados", icon: "users" },
  { id: "checkin", label: "Check-in", icon: "qr" },
  { id: "mural", label: "Mural", icon: "camera", capsuleOnly: true },
  { id: "config", label: "Configurações", icon: "gear" }
];

function Stat({ n, l, sub, accent }: { n: string | number; l: string; sub: string; accent?: string }) {
  return (
    <div className="card" style={{ padding: "18px 20px" }}>
      <div className="serif" style={{ fontSize: 34, fontWeight: 600, color: accent || "var(--ink)", fontVariantNumeric: "tabular-nums" }}>
        {n}
      </div>
      <div style={{ fontWeight: 600, fontSize: 13, marginTop: 2 }}>{l}</div>
      <div className="mono" style={{ fontSize: 9.5, marginTop: 5 }}>
        {sub}
      </div>
    </div>
  );
}

export function EventAdminPanel({
  event,
  subscription,
  coverQuota,
  guestRsvps,
  mediaCount,
  needsRsvp,
  convidadosPanel,
  checkinPanel,
  muralPanel,
  configPanel
}: {
  event: Event;
  subscription: UserSubscription | null;
  coverQuota?: CoverQuota;
  guestRsvps: GuestRsvp[];
  mediaCount: number;
  needsRsvp: boolean;
  convidadosPanel: ReactNode;
  checkinPanel: ReactNode;
  muralPanel: ReactNode;
  configPanel: ReactNode;
}) {
  const [tab, setTab] = useState<TabId>("visao");
  const [expandStorage, setExpandStorage] = useState(false);
  const capsule = hasCapsuleAccess(event);
  const confirmed = guestRsvps.filter((g) => g.rsvpStatus === "confirmed");
  const totalPeople = confirmed.reduce(
    (sum, g) => sum + 1 + (g.companionsDetail?.length ?? g.companionNames?.length ?? (g.companionName ? 1 : 0)),
    0
  );
  const checkedIn = confirmed.filter((g) => g.checkedInAt).length;
  const storage = buildStorageSnapshot({
    event,
    subscription,
    poolUsedBytes: event.storageUsedBytes
  });
  const coverColor = PASTELS[event.id.length % PASTELS.length];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "var(--paper)" }}>
      <div style={{ padding: "20px 32px 0", borderBottom: "1px solid var(--line)", background: "var(--card-2)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
          <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
            <StripePhoto
              color={coverColor}
              imageUrl={event.coverImageUrl}
              style={{ width: 46, height: 46, borderRadius: 12, flexShrink: 0 }}
            />
            <div>
              <div style={{ display: "flex", gap: 9, alignItems: "center", flexWrap: "wrap" }}>
                <h2 className="serif-i" style={{ fontSize: 24 }}>
                  {event.title}
                </h2>
                <Tag kind={capsule ? "cap" : "free"}>{capsule ? "Cápsula" : "Gratuito"}</Tag>
              </div>
              <div style={{ display: "flex", gap: 14, marginTop: 3, color: "var(--muted)", fontSize: 12.5, flexWrap: "wrap" }}>
                <span style={{ display: "inline-flex", gap: 5, alignItems: "center" }}>
                  <Icon name="calendar" size={13} />
                  {formatEventCardDate(event.date, event.startsAt)}
                </span>
                <span style={{ display: "inline-flex", gap: 5, alignItems: "center" }}>
                  <Icon name="pin" size={13} />
                  {event.venueName} · {event.city}
                </span>
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 9, flexWrap: "wrap" }}>
            <Link className="btn btn-ghost btn-sm" href={`/evento/${event.slug}`} target="_blank">
              <Icon name="eye" size={15} />
              Ver convite
            </Link>
            {capsule ? (
              <Link className="btn btn-dark btn-sm" href={`/evento/${event.slug}/telao`} target="_blank">
                <Icon name="proj" size={15} />
                Abrir telão
              </Link>
            ) : null}
          </div>
        </div>
        <div className="app-admin-tabs">
          {TABS.map((t) => {
            if (t.capsuleOnly && !capsule) return null;
            const on = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className="navitem"
                style={{
                  display: "flex",
                  gap: 7,
                  alignItems: "center",
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  padding: "11px 15px",
                  borderBottom: `2.5px solid ${on ? "var(--ink)" : "transparent"}`,
                  marginBottom: -1,
                  color: on ? "var(--ink)" : "var(--muted)",
                  fontWeight: on ? 700 : 500,
                  fontSize: 13.5,
                  fontFamily: "var(--font-sans)"
                }}
              >
                <Icon name={t.icon} size={15} />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="scroll" style={{ flex: 1, overflow: "auto", padding: "28px 32px 50px" }} key={tab}>
        <div className="fadeUp">
          {tab === "visao" && (
            <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 320px", gap: 22, alignItems: "start" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 14 }}>
                  <Stat n={confirmed.length} l="Confirmados" sub="rsvp" accent="var(--coral-deep)" />
                  <Stat n={Math.max(0, guestRsvps.filter((g) => g.rsvpStatus === "declined").length)} l="Recusados" sub="rsvp" />
                  <Stat n={totalPeople} l="Pessoas" sub="com acompanhantes" />
                  <Stat n={checkedIn || "—"} l="Na portaria" sub="check-in" />
                </div>
                <PhaseLine current={getAdminPhaseLineCurrent(event)} capsule={capsule} />
                <div className="card" style={{ padding: "20px 22px" }}>
                  <Mono style={{ display: "block", marginBottom: 14 }}>Atalhos</Mono>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    {[
                      { label: "Compartilhar link", tab: "visao" as TabId, icon: "share" as IconName },
                      { label: "Ver confirmados", tab: "convidados" as TabId, icon: "users" as IconName },
                      { label: "Link da portaria", tab: "checkin" as TabId, icon: "qr" as IconName },
                      { label: "Configurar evento", tab: "config" as TabId, icon: "gear" as IconName }
                    ].map((item) => (
                      <button
                        key={item.label}
                        type="button"
                        onClick={() => setTab(item.tab)}
                        className="rowhover"
                        style={{
                          display: "flex",
                          gap: 11,
                          alignItems: "center",
                          padding: "13px 14px",
                          borderRadius: 12,
                          border: "1px solid var(--line)",
                          background: "#fff",
                          cursor: "pointer",
                          textAlign: "left"
                        }}
                      >
                        <span
                          style={{
                            width: 34,
                            height: 34,
                            borderRadius: 9,
                            background: "var(--card-2)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "var(--coral-deep)"
                          }}
                        >
                          <Icon name={item.icon} size={16} />
                        </span>
                        <span style={{ fontWeight: 600, fontSize: 13 }}>{item.label}</span>
                        <Icon name="chevR" size={14} style={{ color: "var(--faint)", marginLeft: "auto" }} />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                {capsule ? (
                  <div className="card" style={{ padding: 22, background: "var(--dark)", color: "var(--paper)", border: "none" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                      <Icon name="hourglass" size={17} style={{ color: "var(--amber)" }} />
                      <strong style={{ fontSize: 14 }}>Cápsula ativa</strong>
                      <span className="mono" style={{ marginLeft: "auto", color: "var(--amber)", fontSize: 9 }}>
                        36 meses+
                      </span>
                    </div>
                    <Mono style={{ color: "rgba(244,237,223,.55)" }}>
                      Armazenamento · {storage.contractedGb.toFixed(0)} GB
                      {storage.extraGb > 0 ? ` · +${storage.extraGb.toFixed(0)} GB extra` : ""}
                    </Mono>
                    <div style={{ marginTop: 11 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 5, color: "rgba(244,237,223,.85)" }}>
                        <span>Em uso</span>
                        <span style={{ color: "rgba(244,237,223,.5)" }}>{storage.usedGb.toFixed(2)} GB</span>
                      </div>
                      <div style={{ height: 6, borderRadius: 9, background: "#3a3127" }}>
                        <div style={{ width: `${storage.progressPercent}%`, height: "100%", borderRadius: 9, background: "var(--amber)" }} />
                      </div>
                    </div>
                    <p style={{ fontSize: 12, color: "rgba(244,237,223,.7)", margin: "12px 0 0" }}>
                      {mediaCount} memórias publicadas
                    </p>
                    <button type="button" className="btn btn-amber btn-sm" style={{ width: "100%", marginTop: 18 }} onClick={() => setExpandStorage(true)}>
                      Ampliar espaço
                    </button>
                  </div>
                ) : (
                  <PlanUpgradePanel event={event} subscription={subscription} />
                )}
                {coverQuota ? <InviteAiQuotaPanel quota={coverQuota} eventUsed={event.aiCoverGenerationsCount} /> : null}
                {needsRsvp && confirmed.length > 0 ? (
                  <div className="card" style={{ padding: 18 }}>
                    <Mono style={{ display: "block", marginBottom: 12 }}>Confirmações recentes</Mono>
                    {confirmed.slice(0, 4).map((g) => (
                      <div key={g.id} style={{ display: "flex", gap: 10, alignItems: "center", padding: "7px 0" }}>
                        <Avatar name={g.guestName} size={30} />
                        <span style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>{g.guestName}</span>
                        <Icon name="check" size={15} style={{ color: "#7d9a6f" }} sw={2.4} />
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          )}

          {tab === "convidados" && (needsRsvp ? convidadosPanel : <p style={{ color: "var(--muted)" }}>RSVP não habilitado para este evento.</p>)}
          {tab === "checkin" && (needsRsvp ? checkinPanel : <p style={{ color: "var(--muted)" }}>Check-in disponível com RSVP.</p>)}
          {tab === "mural" && (capsule ? muralPanel : <LockedCapsuleView />)}
          {tab === "config" && configPanel}
        </div>
      </div>

      {expandStorage ? (
        <ExpandStorageModal
          eventId={event.id}
          totalGb={Math.round(storage.contractedGb)}
          onClose={() => setExpandStorage(false)}
        />
      ) : null}
    </div>
  );
}
