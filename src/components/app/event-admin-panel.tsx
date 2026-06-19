"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import type { Event, EventMember, GuestRsvp, MediaItem, MuralAccessRequest, UserSubscription } from "@/types/domain";
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

const AdminGuestsPanel = dynamic(
  () => import("@/components/app/admin/admin-guests-panel").then((m) => ({ default: m.AdminGuestsPanel })),
  { loading: () => <AdminTabLoading /> }
);
const AdminCheckinPanel = dynamic(
  () => import("@/components/app/admin/admin-checkin-panel").then((m) => ({ default: m.AdminCheckinPanel })),
  { loading: () => <AdminTabLoading /> }
);
const AdminMuralPanel = dynamic(
  () => import("@/components/app/admin/admin-mural-panel").then((m) => ({ default: m.AdminMuralPanel })),
  { loading: () => <AdminTabLoading /> }
);
const AdminConfigPanel = dynamic(
  () => import("@/components/app/admin/admin-config-panel").then((m) => ({ default: m.AdminConfigPanel })),
  { loading: () => <AdminTabLoading /> }
);

type TabId = "visao" | "convidados" | "checkin" | "mural" | "album" | "config";

const TABS: { id: TabId; label: string; icon: IconName; capsuleOnly?: boolean }[] = [
  { id: "visao", label: "Visão geral", icon: "grid" },
  { id: "convidados", label: "Convidados", icon: "users" },
  { id: "checkin", label: "Check-in", icon: "qr" },
  { id: "mural", label: "Mural", icon: "camera", capsuleOnly: true },
  { id: "album", label: "Álbum de fotos", icon: "print", capsuleOnly: true },
  { id: "config", label: "Configurações", icon: "gear" }
];

function AdminTabLoading() {
  return (
    <div className="admin-tab-loading" aria-hidden="true">
      <div className="page-skeleton-line page-skeleton-line-md" />
      <div className="page-skeleton-line page-skeleton-line-lg" />
    </div>
  );
}

function Stat({ n, l, sub, accent }: { n: string | number; l: string; sub: string; accent?: string }) {
  return (
    <div className="card event-admin-stat">
      <div className="serif event-admin-stat-value" style={{ color: accent || "var(--ink)" }}>
        {n}
      </div>
      <div className="event-admin-stat-label">{l}</div>
      <div className="mono event-admin-stat-sub">{sub}</div>
    </div>
  );
}

export function EventAdminPanel({
  event,
  subscription,
  coverQuota,
  guestRsvps,
  media,
  mediaCount,
  eventMembers,
  muralAccessRequests,
  needsRsvp
}: {
  event: Event;
  subscription: UserSubscription | null;
  coverQuota?: CoverQuota;
  guestRsvps: GuestRsvp[];
  media: MediaItem[];
  mediaCount: number;
  eventMembers: EventMember[];
  muralAccessRequests: MuralAccessRequest[];
  needsRsvp: boolean;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<TabId>("visao");
  const [visitedTabs, setVisitedTabs] = useState<Set<TabId>>(() => new Set(["visao"]));
  const [, startTransition] = useTransition();
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

  useEffect(() => {
    void import("@/components/app/admin/admin-guests-panel");
    void import("@/components/app/admin/admin-checkin-panel");
    void import("@/components/app/admin/admin-mural-panel");
    void import("@/components/app/admin/admin-config-panel");
  }, []);

  function selectTab(next: TabId) {
    if (next === "album") {
      router.push(`/dashboard/eventos/${event.id}/album`);
      return;
    }
    if (next === tab) return;
    startTransition(() => {
      setTab(next);
      setVisitedTabs((current) => {
        if (current.has(next)) return current;
        const updated = new Set(current);
        updated.add(next);
        return updated;
      });
    });
  }

  return (
    <div className="event-admin-shell">
      <div className="event-admin-header">
        <div className="event-admin-header-top">
          <div className="event-admin-title-row">
            <StripePhoto
              color={coverColor}
              imageUrl={event.coverImageUrl}
              style={{ width: 46, height: 46, borderRadius: 12, flexShrink: 0 }}
            />
            <div className="event-admin-title-block">
              <div className="event-admin-title-line">
                <h2 className="serif-i event-admin-title">{event.title}</h2>
                <Tag kind={capsule ? "cap" : "free"}>{capsule ? "Cápsula" : "Gratuito"}</Tag>
              </div>
              <div className="event-admin-meta">
                <span>
                  <Icon name="calendar" size={13} />
                  {formatEventCardDate(event.date, event.startsAt)}
                </span>
                <span>
                  <Icon name="pin" size={13} />
                  {event.venueName} · {event.city}
                </span>
              </div>
            </div>
          </div>
          <div className="event-admin-actions">
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
                onClick={() => selectTab(t.id)}
                className={`app-admin-tab${on ? " is-active" : ""}`}
              >
                <Icon name={t.icon} size={15} />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="scroll event-admin-scroll">
        <div hidden={tab !== "visao"} className="event-admin-tab-panel">
          <div className="event-admin-overview">
            <div className="event-admin-main">
              <div className="event-admin-stats">
                <Stat n={confirmed.length} l="Confirmados" sub="rsvp" accent="var(--coral-deep)" />
                <Stat n={Math.max(0, guestRsvps.filter((g) => g.rsvpStatus === "declined").length)} l="Recusados" sub="rsvp" />
                <Stat n={totalPeople} l="Pessoas" sub="com acompanhantes" />
                <Stat n={checkedIn || "—"} l="Na portaria" sub="check-in" />
              </div>
              <PhaseLine current={getAdminPhaseLineCurrent(event)} capsule={capsule} />
              <div className="card event-admin-shortcuts-card">
                <Mono style={{ display: "block", marginBottom: 14 }}>Atalhos</Mono>
                <div className="event-admin-shortcuts">
                  {capsule ? (
                    <Link className="event-admin-shortcut" href={`/dashboard/eventos/${event.id}/album`}>
                      <span className="event-admin-shortcut-icon">
                        <Icon name="print" size={16} />
                      </span>
                      <span className="event-admin-shortcut-label">Álbum de fotos</span>
                      <Icon name="chevR" size={14} style={{ color: "var(--faint)", marginLeft: "auto" }} />
                    </Link>
                  ) : null}
                  {[
                    { label: "Compartilhar link", tab: "visao" as TabId, icon: "share" as IconName },
                    { label: "Ver confirmados", tab: "convidados" as TabId, icon: "users" as IconName },
                    { label: "Link da portaria", tab: "checkin" as TabId, icon: "qr" as IconName },
                    { label: "Configurar evento", tab: "config" as TabId, icon: "gear" as IconName }
                  ].map((item) => (
                    <button key={item.label} type="button" onClick={() => selectTab(item.tab)} className="event-admin-shortcut">
                      <span className="event-admin-shortcut-icon">
                        <Icon name={item.icon} size={16} />
                      </span>
                      <span className="event-admin-shortcut-label">{item.label}</span>
                      <Icon name="chevR" size={14} style={{ color: "var(--faint)", marginLeft: "auto" }} />
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="event-admin-sidebar">
              {capsule ? (
                <div className="card event-admin-capsule-card">
                  <div className="event-admin-capsule-head">
                    <Icon name="hourglass" size={17} style={{ color: "var(--amber)" }} />
                    <strong>Cápsula ativa</strong>
                    <span className="mono event-admin-capsule-badge">36 meses+</span>
                  </div>
                  <Mono style={{ color: "rgba(244,237,223,.55)" }}>
                    Armazenamento · {storage.contractedGb.toFixed(0)} GB
                    {storage.extraGb > 0 ? ` · +${storage.extraGb.toFixed(0)} GB extra` : ""}
                  </Mono>
                  <div className="event-admin-storage-bar-wrap">
                    <div className="event-admin-storage-bar-labels">
                      <span>Em uso</span>
                      <span>{storage.usedGb.toFixed(2)} GB</span>
                    </div>
                    <div className="event-admin-storage-bar">
                      <div className="event-admin-storage-bar-fill" style={{ width: `${storage.progressPercent}%` }} />
                    </div>
                  </div>
                  <p className="event-admin-capsule-note">{mediaCount} memórias publicadas</p>
                  <button type="button" className="btn btn-amber btn-sm event-admin-expand-btn" onClick={() => setExpandStorage(true)}>
                    Ampliar espaço
                  </button>
                </div>
              ) : (
                <PlanUpgradePanel event={event} subscription={subscription} />
              )}
              {coverQuota ? <InviteAiQuotaPanel quota={coverQuota} eventUsed={event.aiCoverGenerationsCount} /> : null}
              {needsRsvp && confirmed.length > 0 ? (
                <div className="card event-admin-recent-rsvps">
                  <Mono style={{ display: "block", marginBottom: 12 }}>Confirmações recentes</Mono>
                  {confirmed.slice(0, 4).map((g) => (
                    <div key={g.id} className="event-admin-rsvp-row">
                      <Avatar name={g.guestName} size={30} />
                      <span className="event-admin-rsvp-name">{g.guestName}</span>
                      <Icon name="check" size={15} style={{ color: "#7d9a6f" }} sw={2.4} />
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {visitedTabs.has("convidados") ? (
          <div hidden={tab !== "convidados"} className="event-admin-tab-panel">
            {needsRsvp ? (
              <AdminGuestsPanel eventId={event.id} initialRsvps={guestRsvps} />
            ) : (
              <p style={{ color: "var(--muted)" }}>RSVP não habilitado para este evento.</p>
            )}
          </div>
        ) : null}

        {visitedTabs.has("checkin") ? (
          <div hidden={tab !== "checkin"} className="event-admin-tab-panel">
            {needsRsvp ? (
              <AdminCheckinPanel
                eventId={event.id}
                eventSlug={event.slug}
                eventFreeCode={event.freeCode}
                initialRsvps={guestRsvps}
              />
            ) : (
              <p style={{ color: "var(--muted)" }}>Check-in disponível com RSVP.</p>
            )}
          </div>
        ) : null}

        {visitedTabs.has("mural") ? (
          <div hidden={tab !== "mural"} className="event-admin-tab-panel">
            {capsule ? (
              <AdminMuralPanel event={event} items={media} initialAccessRequests={muralAccessRequests} />
            ) : (
              <LockedCapsuleView />
            )}
          </div>
        ) : null}

        {visitedTabs.has("config") ? (
          <div hidden={tab !== "config"} className="event-admin-tab-panel">
            <AdminConfigPanel
              event={event}
              members={eventMembers}
              capsuleActive={Boolean(event.capsuleActivatedAt)}
              needsRsvp={needsRsvp}
            />
          </div>
        ) : null}
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
