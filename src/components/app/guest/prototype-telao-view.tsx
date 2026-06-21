"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Event, MediaItem } from "@/types/domain";
import { Icon } from "@/components/app/ui/icon";
import { Mono, StripePhoto } from "@/components/app/ui/primitives";
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
  const [liveEvent, setLiveEvent] = useState(event);
  const liveEventRef = useRef(event);
  const [items, setItems] = useState(() => filterTelaoItems(initialItems, event));
  const photos = useMemo(() => items.filter((p) => p.type !== "message"), [items]);
  const recados = useMemo(() => items.filter((p) => p.type === "message"), [items]);
  const [viewMode, setViewMode] = useState<"single" | "hero_two">("single");
  const [feat, setFeat] = useState(0);
  const [rec, setRec] = useState(0);
  const [expandedImage, setExpandedImage] = useState<{ url: string; alt: string } | null>(null);

  useEffect(() => {
    liveEventRef.current = liveEvent;
  }, [liveEvent]);

  useEffect(() => {
    const source = new EventSource(`/api/events/${event.id}/stream`);
    function refreshSnapshot() {
      fetch(`/api/events/${event.id}`, { cache: "no-store" })
        .then((response) => response.json() as Promise<{ event?: Event; media?: MediaItem[] }>)
        .then((snapshot) => {
          if (!snapshot.event || !snapshot.media) return;
          setLiveEvent(snapshot.event);
          setItems(filterTelaoItems(snapshot.media, snapshot.event));
        })
        .catch(() => undefined);
    }

    function upsertIncoming(item: MediaItem) {
      setItems((current) =>
        filterTelaoItems(
          current.some((row) => row.id === item.id)
            ? current.map((row) => (row.id === item.id ? item : row))
            : [item, ...current],
          liveEventRef.current
        )
      );
    }

    source.addEventListener("media.created", (message) => {
      const payload = JSON.parse((message as MessageEvent).data) as { item: MediaItem };
      upsertIncoming(payload.item);
    });
    source.addEventListener("media.updated", (message) => {
      const payload = JSON.parse((message as MessageEvent).data) as { item: MediaItem };
      upsertIncoming(payload.item);
    });
    source.addEventListener("screen.changed", refreshSnapshot);
    const sync = setInterval(refreshSnapshot, 12_000);

    refreshSnapshot();
    return () => {
      clearInterval(sync);
      source.close();
    };
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

  useEffect(() => {
    if (!photos.length) {
      setFeat(0);
      return;
    }
    setFeat((current) => (current >= photos.length ? 0 : current));
  }, [photos.length]);

  useEffect(() => {
    if (!recados.length) {
      setRec(0);
      return;
    }
    setRec((current) => (current >= recados.length ? 0 : current));
  }, [recados.length]);

  const mainItems = useMemo(() => {
    if (photos.length === 0) return [] as MediaItem[];
    const count = viewMode === "single" ? 1 : 3;
    const selected: MediaItem[] = [];
    for (let i = 0; i < Math.min(count, photos.length); i += 1) {
      selected.push(photos[(feat + i) % photos.length]);
    }
    return selected;
  }, [feat, photos, viewMode]);

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
        <div
          style={{
            position: "absolute",
            inset: 0,
            padding: "2.2%",
            display: viewMode === "hero_two" ? "grid" : "flex",
            gap: "1.8%",
            gridTemplateColumns: viewMode === "hero_two" ? "2fr 1fr" : undefined,
            gridTemplateRows: viewMode === "hero_two" ? "1fr 1fr" : undefined,
            alignItems: "stretch"
          }}
        >
          {mainItems.length > 0
            ? mainItems.map((item, index) => {
                const imageUrl = resolveMediaItemUrl(event.id, item);
                const isHero = viewMode === "hero_two" && index === 0;
                return (
                  <div
                    key={item.id}
                    style={{
                      borderRadius: 16,
                      overflow: "hidden",
                      background: "#f7eedb",
                      position: "relative",
                      display: "grid",
                      placeItems: "center",
                      minHeight: 0,
                      ...(viewMode === "single"
                        ? { flex: 1 }
                        : isHero
                          ? { gridRow: "1 / span 2" }
                          : null)
                    }}
                  >
                    {imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={imageUrl}
                        alt={item.caption || `Memória de ${item.authorName}`}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: viewMode === "single" ? "contain" : "cover",
                          borderRadius: 12
                        }}
                      />
                    ) : (
                      <StripePhoto color="var(--p-green)" ratio="auto" radius={16} style={{ position: "absolute", inset: 0, height: "100%" }} />
                    )}
                  </div>
                );
              })
            : null}
        </div>
        <div style={{ position: "absolute", top: 0, left: 0, padding: "2.4%", display: "flex", gap: 10, alignItems: "center", zIndex: 2 }}>
          <span className="pulse" style={{ width: 9, height: 9, borderRadius: 99, background: "var(--coral)" }} />
          <span className="mono" style={{ color: "#fff", fontSize: 12, letterSpacing: ".18em" }}>
            Ao vivo
          </span>
        </div>
        <div style={{ position: "absolute", right: "2.4%", top: "2.4%", display: "flex", gap: 8, zIndex: 3 }}>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            style={{
              background: viewMode === "single" ? "rgba(242,107,90,.85)" : "rgba(20,16,12,.6)",
              color: "#fff",
              borderColor: "rgba(247,238,219,.28)"
            }}
            onClick={() => setViewMode("single")}
          >
            <Icon name="image" size={14} /> 1
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            style={{
              background: viewMode === "hero_two" ? "rgba(242,107,90,.85)" : "rgba(20,16,12,.6)",
              color: "#fff",
              borderColor: "rgba(247,238,219,.28)"
            }}
            onClick={() => setViewMode("hero_two")}
          >
            <Icon name="grid" size={14} /> 3
          </button>
        </div>
        {mainItems[0] ? (
          <div style={{ position: "absolute", right: "2.4%", top: "10.5%", display: "flex", gap: 8, zIndex: 3 }}>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              style={{ background: "rgba(20,16,12,.6)", color: "#fff", borderColor: "rgba(247,238,219,.28)" }}
              onClick={() => {
                const url = resolveMediaItemUrl(event.id, mainItems[0]);
                if (!url) return;
                setExpandedImage({ url, alt: mainItems[0].caption || `Memória de ${mainItems[0].authorName}` });
              }}
            >
              <Icon name="eye" size={14} /> Ver inteira
            </button>
            <a
              className="btn btn-ghost btn-sm"
              style={{ background: "rgba(20,16,12,.6)", color: "#fff", borderColor: "rgba(247,238,219,.28)" }}
              href={resolveMediaItemUrl(event.id, mainItems[0]) ?? "#"}
              download
              target="_blank"
              rel="noreferrer"
            >
              <Icon name="download" size={14} /> Baixar
            </a>
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
                    border: mainItems.some((item) => item.id === p.id) ? "2px solid var(--coral)" : "none"
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

      {expandedImage ? (
        <div
          onClick={() => setExpandedImage(null)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 90,
            background: "rgba(12,9,6,.85)",
            display: "grid",
            placeItems: "center",
            padding: "2.5%"
          }}
        >
          <button
            type="button"
            onClick={() => setExpandedImage(null)}
            style={{
              position: "absolute",
              top: 20,
              right: 20,
              border: "1px solid rgba(247,238,219,.25)",
              background: "rgba(20,16,12,.6)",
              color: "#fff",
              borderRadius: 10,
              padding: "8px 10px",
              cursor: "pointer"
            }}
          >
            Fechar
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={expandedImage.url}
            alt={expandedImage.alt}
            onClick={(event) => event.stopPropagation()}
            style={{
              maxWidth: "96vw",
              maxHeight: "92vh",
              width: "auto",
              height: "auto",
              objectFit: "contain",
              borderRadius: 12,
              background: "#111"
            }}
          />
        </div>
      ) : null}
    </div>
  );
}

function filterTelaoItems(items: MediaItem[], event: Event) {
  if (!event.screen.enabled || event.screen.paused) return [];

  return items.filter((item) => {
    if (item.status !== "published" || !item.visibleOnScreen) return false;
    if (item.type === "video" && !event.screen.showVideos) return false;
    if (item.type === "message" && !event.screen.showMessages) return false;
    if (item.type === "message" && !item.text) return false;
    return true;
  });
}
