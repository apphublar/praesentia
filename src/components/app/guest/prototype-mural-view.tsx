"use client";

import { useEffect, useMemo, useState } from "react";
import type { Event, MediaItem } from "@/types/domain";
import { Icon } from "@/components/app/ui/icon";
import { Avatar, Mono, StripePhoto } from "@/components/app/ui/primitives";
import { GuestContributionPanel } from "@/components/event/guest-contribution-panel";
import { LikeButton } from "@/components/event/like-button";
import { MuralAccessPanel } from "@/components/event/mural-access-panel";
import { resolveMediaItemUrl } from "@/lib/storage/media-url";

function MuralPost({ eventId, item, fresh }: { eventId: string; item: MediaItem; fresh?: boolean }) {
  const isMessage = item.type === "message";
  const url = resolveMediaItemUrl(eventId, item);

  return (
    <div className={fresh ? "floatUp" : ""} style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", gap: 9, alignItems: "center", marginBottom: 8 }}>
        <Avatar name={item.authorName} size={30} />
        <span style={{ fontWeight: 700, fontSize: 13 }}>{item.authorName}</span>
      </div>
      {isMessage ? (
        <div style={{ background: "var(--dark-2)", border: "1px solid var(--dark-line)", borderRadius: "4px 16px 16px 16px", padding: "16px 18px" }}>
          <p className="serif-i" style={{ margin: 0, fontSize: 17, lineHeight: 1.4, color: "var(--paper)" }}>
            "{item.text}"
          </p>
        </div>
      ) : (
        <div style={{ borderRadius: 16, overflow: "hidden", position: "relative" }}>
          {url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt="" style={{ width: "100%", aspectRatio: "4/5", objectFit: "cover", display: "block" }} />
          ) : (
            <StripePhoto color="var(--p-green)" ratio="4 / 5" radius={16} />
          )}
          {item.caption ? (
            <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: "24px 14px 12px", background: "linear-gradient(transparent,rgba(20,16,12,.8))" }}>
              <p className="serif-i" style={{ margin: 0, fontSize: 15, color: "#fff" }}>
                {item.caption}
              </p>
            </div>
          ) : null}
        </div>
      )}
      <div style={{ marginTop: 9 }}>
        <LikeButton eventId={eventId} mediaId={item.id} initialCount={item.likesCount} guestMural />
      </div>
    </div>
  );
}

export function PrototypeMuralView({
  event,
  media,
  guestRsvpId,
  guestName,
  readOnly = false,
  capsuleActive
}: {
  event: Event;
  media: MediaItem[];
  guestRsvpId?: string;
  guestName?: string;
  readOnly?: boolean;
  capsuleActive: boolean;
}) {
  const [liveMedia, setLiveMedia] = useState(media);
  const [composing, setComposing] = useState(false);

  useEffect(() => {
    const source = new EventSource(`/api/events/${event.id}/stream`);
    source.addEventListener("media.created", (message) => {
      const payload = JSON.parse((message as MessageEvent).data) as { item: MediaItem };
      setLiveMedia((current) => [payload.item, ...current.filter((item) => item.id !== payload.item.id)]);
    });
    source.addEventListener("media.updated", (message) => {
      const payload = JSON.parse((message as MessageEvent).data) as { item: MediaItem };
      setLiveMedia((current) => current.map((item) => (item.id === payload.item.id ? payload.item : item)).filter((item) => item.status === "published"));
    });
    return () => source.close();
  }, [event.id]);

  const guestItems = useMemo(
    () => (guestRsvpId ? liveMedia.filter((item) => item.guestRsvpId === guestRsvpId) : []),
    [guestRsvpId, liveMedia]
  );

  if (!guestRsvpId) {
    return (
      <div className="prototype-guest-scroll" style={{ minHeight: "100%", background: "var(--dark)", color: "var(--paper)" }}>
        <MuralAccessPanel eventId={event.id} capsuleActive={capsuleActive} mode={readOnly ? "memory" : "live"} eventTitle={event.title} />
      </div>
    );
  }

  if (readOnly) {
    return <PrototypeCapsulaGallery event={event} media={liveMedia} guestName={guestName} />;
  }

  return (
    <div style={{ minHeight: "100%", display: "flex", flexDirection: "column", background: "var(--dark)", color: "var(--paper)", position: "relative" }}>
      <div style={{ padding: "52px 18px 14px", borderBottom: "1px solid var(--dark-line)", background: "var(--dark)", zIndex: 4 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span className="pulse" style={{ width: 9, height: 9, borderRadius: 99, background: "var(--coral)" }} />
          <span className="mono" style={{ color: "var(--coral)", fontWeight: 700 }}>
            Ao vivo
          </span>
          <span className="mono" style={{ marginLeft: "auto", color: "rgba(244,237,223,.5)" }}>
            {liveMedia.length} no mural
          </span>
        </div>
        <h1 className="serif-i" style={{ fontSize: 25, fontWeight: 600, marginTop: 8 }}>
          Mural · {event.title}
        </h1>
      </div>

      <div className="scroll" style={{ flex: 1, overflow: "auto", padding: "14px 14px 120px" }}>
        {liveMedia.map((item, i) => (
          <MuralPost key={item.id} eventId={event.id} item={item} fresh={i === 0} />
        ))}
      </div>

      <div style={{ position: "sticky", bottom: 0, padding: "12px 16px 30px", background: "linear-gradient(transparent,var(--dark) 30%)" }}>
        {composing ? (
          <div className="pop" style={{ background: "var(--dark-2)", borderRadius: 18, padding: 14, border: "1px solid var(--dark-line)" }}>
            <GuestContributionPanel
              eventId={event.id}
              items={guestItems}
              guestRsvpId={guestRsvpId}
              muralGuestMode
              onCreated={(item) => {
                setLiveMedia((current) => [item, ...current.filter((row) => row.id !== item.id)]);
                setComposing(false);
              }}
            />
            <button type="button" onClick={() => setComposing(false)} style={{ width: "100%", marginTop: 6, background: "transparent", border: "none", color: "rgba(244,237,223,.5)", cursor: "pointer", fontSize: 12 }}>
              cancelar
            </button>
          </div>
        ) : (
          <button type="button" onClick={() => setComposing(true)} className="btn btn-coral" style={{ width: "100%", padding: 15, fontSize: 15 }}>
            <Icon name="camera" size={19} />
            Compartilhar um momento
          </button>
        )}
      </div>
    </div>
  );
}

function PrototypeCapsulaGallery({ event, media, guestName }: { event: Event; media: MediaItem[]; guestName?: string }) {
  const photos = media.filter((m) => m.type !== "message");
  const messages = media.filter((m) => m.type === "message");

  return (
    <div className="scroll prototype-guest-scroll" style={{ height: "100%", overflow: "auto", background: "var(--paper)" }}>
      <div style={{ padding: "46px 20px 26px", textAlign: "center", background: "var(--card-2)", borderBottom: "1px solid var(--line)" }}>
        <span className="pill" style={{ borderColor: "var(--line-2)" }}>
          <Icon name="hourglass" size={12} style={{ color: "var(--coral-deep)" }} />
          cápsula guardada
        </span>
        <h1 className="serif-i" style={{ fontSize: 29, fontWeight: 600, margin: "12px 0 4px" }}>
          {event.title}
        </h1>
        {guestName ? <p style={{ margin: 0, color: "var(--muted)", fontSize: 13 }}>Olá, {guestName}</p> : null}
      </div>
      <div style={{ display: "flex", gap: 9, alignItems: "center", padding: "11px 18px", borderBottom: "1px solid var(--line)" }}>
        <Icon name="lock" size={14} style={{ color: "var(--muted)" }} />
        <span style={{ fontSize: 11.5, color: "var(--muted)" }}>Só para revisitar — sem postar, curtir ou excluir.</span>
      </div>
      <div style={{ padding: "22px 16px 40px" }}>
        <Mono style={{ display: "block", marginBottom: 14 }}>O dia em fotos</Mono>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px 14px" }}>
          {photos.map((item, i) => {
            const url = resolveMediaItemUrl(event.id, item);
            return (
              <div key={item.id} style={{ transform: `rotate(${[-3, 2, -1.5, 2.5][i % 4]}deg)` }}>
                <div className="polaroid" style={{ width: "100%" }}>
                  <div className="tape" style={{ background: i % 2 ? "var(--tape-c)" : "var(--tape-y)" }} />
                  {url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={url} alt="" style={{ width: "100%", aspectRatio: "1/1.08", objectFit: "cover" }} />
                  ) : (
                    <StripePhoto color="var(--p-green)" ratio="1 / 1.08" />
                  )}
                  {item.caption ? <div className="cap">{item.caption}</div> : null}
                </div>
              </div>
            );
          })}
        </div>
        {messages.length > 0 ? (
          <>
            <Mono style={{ display: "block", margin: "30px 0 14px" }}>Recados guardados</Mono>
            {messages.map((m) => (
              <div key={m.id} className="card" style={{ padding: "16px 18px", marginBottom: 12 }}>
                <p className="serif-i" style={{ margin: "0 0 10px", fontSize: 16, lineHeight: 1.4 }}>
                  "{m.text}"
                </p>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <Avatar name={m.authorName} size={26} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)" }}>{m.authorName}</span>
                </div>
              </div>
            ))}
          </>
        ) : null}
      </div>
    </div>
  );
}
