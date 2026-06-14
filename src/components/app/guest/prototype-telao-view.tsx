"use client";

import { useEffect, useMemo, useState } from "react";
import type { Event, MediaItem } from "@/types/domain";
import { Icon } from "@/components/app/ui/icon";
import { Avatar, Mono, StripePhoto } from "@/components/app/ui/primitives";
import { resolveMediaItemUrl } from "@/lib/storage/media-url";

export function PrototypeTelaoView({
  event,
  initialItems,
  embedded = false
}: {
  event: Event;
  initialItems: MediaItem[];
  embedded?: boolean;
}) {
  const [items, setItems] = useState(initialItems.filter((i) => i.type !== "message" || i.text));
  const photos = useMemo(() => items.filter((p) => p.type !== "message"), [items]);
  const recados = useMemo(() => items.filter((p) => p.type === "message"), [items]);
  const [feat, setFeat] = useState(0);
  const [rec, setRec] = useState(0);

  useEffect(() => {
    const source = new EventSource(`/api/events/${event.id}/stream`);
    source.addEventListener("media.created", (message) => {
      const payload = JSON.parse((message as MessageEvent).data) as { item: MediaItem };
      setItems((current) => [payload.item, ...current.filter((item) => item.id !== payload.item.id)]);
    });
    return () => source.close();
  }, [event.id]);

  useEffect(() => {
    if (!photos.length) return;
    const a = setInterval(() => setFeat((f) => (f + 1) % photos.length), 3800);
    return () => clearInterval(a);
  }, [photos.length]);

  useEffect(() => {
    if (!recados.length) return;
    const b = setInterval(() => setRec((r) => (r + 1) % recados.length), 5200);
    return () => clearInterval(b);
  }, [recados.length]);

  const f = photos[feat] ?? photos[0];
  const muralUrl = typeof window !== "undefined" ? `${window.location.origin}/evento/${event.slug}` : `/evento/${event.slug}`;

  return (
    <div
      style={{
        width: "100%",
        minHeight: embedded ? "100%" : "100vh",
        height: embedded ? "100%" : undefined,
        background: "var(--dark)",
        color: "var(--paper)",
        display: "flex",
        padding: "3.2%",
        gap: "2.4%",
        position: "relative",
        overflow: "hidden"
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "radial-gradient(circle at 20% 10%,rgba(242,107,90,.10),transparent 40%),radial-gradient(circle at 90% 90%,rgba(242,169,60,.08),transparent 45%)"
        }}
      />

      <div style={{ flex: "1 1 62%", position: "relative", borderRadius: 20, overflow: "hidden", minHeight: "70vh" }}>
        {photos.map((p, i) => {
          const url = resolveMediaItemUrl(event.id, p);
          return (
            <div
              key={p.id}
              style={{
                position: "absolute",
                inset: 0,
                opacity: i === feat ? 1 : 0,
                transition: "opacity 1s ease"
              }}
            >
              {url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <StripePhoto color="var(--p-green)" ratio="auto" radius={20} style={{ position: "absolute", inset: 0, height: "100%" }} />
              )}
            </div>
          );
        })}
        <div style={{ position: "absolute", top: 0, left: 0, padding: "2.4%", display: "flex", gap: 10, alignItems: "center", zIndex: 2 }}>
          <span className="pulse" style={{ width: 9, height: 9, borderRadius: 99, background: "var(--coral)" }} />
          <span className="mono" style={{ color: "#fff", fontSize: 12, letterSpacing: ".18em" }}>
            Ao vivo
          </span>
        </div>
        {f ? (
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              padding: "8% 2.6% 2.6%",
              background: "linear-gradient(transparent,rgba(20,16,12,.85))",
              zIndex: 2
            }}
          >
            <div className="serif-i" style={{ fontSize: "clamp(22px,2.6vw,36px)", fontWeight: 600, color: "#fff", lineHeight: 1.05 }}>
              {f.caption || f.authorName}
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: "1%" }}>
              <Avatar name={f.authorName} size={34} />
              <span style={{ fontSize: 14, fontWeight: 600 }}>{f.authorName}</span>
            </div>
          </div>
        ) : null}
      </div>

      <div style={{ flex: "1 1 36%", display: "flex", flexDirection: "column", gap: "4%", position: "relative", zIndex: 1 }}>
        <div style={{ display: "flex", gap: "4%", alignItems: "center" }}>
          <div style={{ flex: 1 }}>
            <div className="mono" style={{ color: "var(--amber)", fontSize: 11 }}>
              Praesentia · ao vivo
            </div>
            <div className="serif-i" style={{ fontSize: "clamp(20px,2vw,28px)", fontWeight: 600, lineHeight: 1.04, marginTop: "2%" }}>
              {event.title}
            </div>
            <div style={{ display: "flex", gap: "6%", marginTop: "5%" }}>
              <div>
                <div className="serif" style={{ fontSize: 24, fontWeight: 600, fontStyle: "italic", color: "var(--coral)" }}>
                  {photos.length}
                </div>
                <div className="mono" style={{ fontSize: 9 }}>
                  momentos
                </div>
              </div>
              <div>
                <div className="serif" style={{ fontSize: 24, fontWeight: 600, fontStyle: "italic" }}>
                  {items.length}
                </div>
                <div className="mono" style={{ fontSize: 9 }}>
                  no mural
                </div>
              </div>
            </div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                width: 78,
                height: 78,
                borderRadius: 12,
                background: "#fff",
                display: "grid",
                gridTemplateColumns: "repeat(7,1fr)",
                gridTemplateRows: "repeat(7,1fr)",
                gap: 2,
                padding: 8
              }}
            >
              {Array.from({ length: 49 }).map((_, i) => (
                <span key={i} style={{ borderRadius: 1, background: i % 3 === 0 ? "var(--dark)" : "transparent" }} />
              ))}
            </div>
            <div className="mono" style={{ fontSize: 9, marginTop: 8, color: "rgba(244,237,223,.6)" }}>
              entre no mural
            </div>
            <div style={{ fontSize: 9, marginTop: 4, wordBreak: "break-all", maxWidth: 90 }}>{muralUrl.replace(/^https?:\/\//, "")}</div>
          </div>
        </div>

        <div style={{ flex: 1, minHeight: 0 }}>
          <div className="mono" style={{ fontSize: 10, marginBottom: "3%", color: "rgba(244,237,223,.5)" }}>
            Chegando agora
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "3%" }}>
            {photos.slice(0, 6).map((p, i) => {
              const url = resolveMediaItemUrl(event.id, p);
              return url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={p.id}
                  src={url}
                  alt=""
                  style={{
                    width: "100%",
                    aspectRatio: "1/1",
                    objectFit: "cover",
                    borderRadius: 10,
                    border: i === feat ? "2px solid var(--coral)" : "none"
                  }}
                />
              ) : (
                <StripePhoto key={p.id} color="var(--p-blue)" ratio="1 / 1" radius={10} />
              );
            })}
          </div>
        </div>

        {recados.length > 0 ? (
          <div
            style={{
              background: "var(--dark-2)",
              border: "1px solid var(--dark-line)",
              borderRadius: 16,
              padding: "16px 18px"
            }}
          >
            <div className="mono" style={{ fontSize: 10, color: "var(--amber)", marginBottom: 8 }}>
              Recado no telão
            </div>
            <div key={rec} className="fadeUp">
              <p className="serif-i" style={{ margin: 0, fontSize: 16, lineHeight: 1.35, color: "#fff" }}>
                "{recados[rec]?.text}"
              </p>
              <div style={{ fontSize: 12, color: "rgba(244,237,223,.6)", marginTop: 8 }}>— {recados[rec]?.authorName}</div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
