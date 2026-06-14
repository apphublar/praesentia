"use client";

import type { CSSProperties } from "react";
import { Confetti, StripePhoto } from "@/components/app/ui/primitives";
import { photoSizePercent, type PhotoOverlayConfig, type PhotoSize } from "@/lib/images/photo-zone-instructions";

export type { PhotoOverlayConfig, PhotoSize };

/** Tema fixo da prévia placeholder — independente do estilo visual escolhido para o prompt. */
const PLACEHOLDER_THEME = { t: "var(--p-sand)", a: "#8a8173" };

function Leaf({ accent, style }: { accent: string; style?: CSSProperties }) {
  return (
    <svg width="42" height="42" viewBox="0 0 24 24" fill="none" style={style}>
      <path d="M12 2C7 6 5 11 6 18c5 1 10-2 12-7 1-3 0-7-6-9z" stroke={accent} strokeWidth="1.2" fill="none" />
      <path d="M12 4c-1 5-2 9-5 13" stroke={accent} strokeWidth="1" fill="none" />
    </svg>
  );
}

function PhotoOverlay({ ph, compact }: { ph: PhotoOverlayConfig; compact?: boolean }) {
  const pv = ph.pos[0];
  const pH = ph.pos[1];
  const m = compact ? "8%" : "6%";
  const widthPct = `${photoSizePercent(ph.size) * 100}%`;
  const isOriginal = ph.shape === "original";
  const st: CSSProperties = {
    position: "absolute",
    width: widthPct,
    zIndex: 4,
    ...(isOriginal ? {} : { aspectRatio: "1 / 1" })
  };
  let tx = "0";
  let ty = "0";
  if (pH === "l") st.left = m;
  else if (pH === "r") st.right = m;
  else {
    st.left = "50%";
    tx = "-50%";
  }
  if (pv === "t") st.top = m;
  else if (pv === "b") st.bottom = m;
  else {
    st.top = "50%";
    ty = "-50%";
  }
  st.transform = `translate(${tx},${ty})`;
  const ring = ph.shape !== "original";
  const radius: CSSProperties["borderRadius"] = ph.shape === "round" ? "50%" : ph.shape === "square" ? "12%" : 8;
  const frame: CSSProperties = ring
    ? { border: "3px solid rgba(255,255,255,.92)", boxShadow: "0 10px 22px -8px rgba(0,0,0,.5)", overflow: "hidden", borderRadius: radius }
    : { filter: "drop-shadow(0 8px 14px rgba(0,0,0,.28))", borderRadius: radius };

  return (
    <div style={st}>
      <div style={{ width: "100%", ...frame }}>
        {ph.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={ph.imageUrl}
            alt=""
            style={{
              width: "100%",
              height: isOriginal ? "auto" : "100%",
              display: "block",
              objectFit: isOriginal ? "contain" : "cover"
            }}
          />
        ) : (
          <StripePhoto color={ph.color} ratio={isOriginal ? "4 / 5" : "1 / 1"} radius={0} style={{ height: isOriginal ? "auto" : "100%" }} />
        )}
      </div>
    </div>
  );
}

export function InviteArt({
  title,
  themeLabel,
  dateShort,
  time,
  place,
  width = "100%",
  compact = false,
  info = true,
  photo = null,
  coverUrl,
  style
}: {
  title: string;
  themeLabel?: string;
  dateShort?: string;
  time?: string;
  place?: string;
  width?: string | number;
  compact?: boolean;
  info?: boolean;
  photo?: PhotoOverlayConfig | null;
  coverUrl?: string;
  style?: CSSProperties;
}) {
  const { t: theme, a: accent } = PLACEHOLDER_THEME;

  if (coverUrl) {
    return (
      <div style={{ width, position: "relative", ...style }}>
        <div
          style={{
            borderRadius: 14,
            overflow: "hidden",
            boxShadow: "0 18px 40px -18px rgba(34,27,20,.45)",
            background: "var(--card-2)",
            position: "relative"
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={coverUrl} alt="" style={{ width: "100%", height: "auto", display: "block", verticalAlign: "top" }} />
          {photo ? <PhotoOverlay ph={photo} compact={compact} /> : null}
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        width,
        aspectRatio: compact ? "1 / 1" : "9 / 16",
        borderRadius: 14,
        overflow: "hidden",
        position: "relative",
        background: theme,
        boxShadow: "0 18px 40px -18px rgba(34,27,20,.45)",
        border: "1px solid rgba(0,0,0,.05)",
        ...style
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: "repeating-linear-gradient(135deg,rgba(255,255,255,.4) 0 1.5px,transparent 1.5px 14px)"
        }}
      />
      <Leaf accent={accent} style={{ position: "absolute", top: -6, left: -6, transform: "rotate(20deg)", opacity: 0.5 }} />
      <Leaf accent={accent} style={{ position: "absolute", bottom: 8, right: -4, transform: "rotate(160deg)", opacity: 0.45 }} />
      <Confetti style={{ opacity: 0.5 }} />
      <div
        style={{
          position: "absolute",
          inset: 0,
          padding: compact ? "18px" : "6% 8%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "space-between",
          textAlign: "center"
        }}
      >
        <div className="mono" style={{ color: accent, letterSpacing: ".22em", fontSize: compact ? 8 : 10 }}>
          Praesentia · Convite
        </div>
        <div>
          <div className="mono" style={{ color: "rgba(40,33,26,.55)", fontSize: compact ? 8 : 10, marginBottom: 8 }}>
            com muito carinho, você está convidado
          </div>
          <div
            className="serif-i"
            style={{ fontSize: compact ? 26 : "clamp(22px,4vw,38px)", color: "#2a241c", lineHeight: 1.02, fontWeight: 600 }}
          >
            {title}
          </div>
          {themeLabel ? (
            <div className="serif-i" style={{ fontSize: compact ? 12 : 15, color: accent, marginTop: 6 }}>
              {themeLabel}
            </div>
          ) : null}
        </div>
        {info && dateShort ? (
          <div
            style={{
              display: "flex",
              gap: compact ? 10 : 16,
              alignItems: "center",
              flexWrap: "wrap",
              justifyContent: "center",
              fontFamily: "var(--font-sans)",
              fontSize: compact ? 9 : 12,
              color: "#3a3127",
              fontWeight: 600
            }}
          >
            <span>{dateShort}</span>
            {time ? (
              <>
                <span style={{ width: 4, height: 4, borderRadius: 9, background: accent }} />
                <span>{time}</span>
              </>
            ) : null}
            {place ? (
              <>
                <span style={{ width: 4, height: 4, borderRadius: 9, background: accent }} />
                <span>{place}</span>
              </>
            ) : null}
          </div>
        ) : (
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            {[0, 1, 2].map((i) => (
              <span key={i} style={{ width: 5, height: 5, borderRadius: 9, background: accent, opacity: 0.6 }} />
            ))}
          </div>
        )}
      </div>
      {photo ? <PhotoOverlay ph={photo} compact={compact} /> : null}
    </div>
  );
}
