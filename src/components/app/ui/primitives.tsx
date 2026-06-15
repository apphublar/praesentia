"use client";

import type { CSSProperties, ReactNode } from "react";
import { Icon } from "./icon";

export function Mono({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <span className="mono" style={style}>
      {children}
    </span>
  );
}

export function Tag({
  kind = "free",
  children,
  style
}: {
  kind?: "free" | "cap";
  children: ReactNode;
  style?: CSSProperties;
}) {
  const cls = kind === "cap" ? "tag-cap" : "tag-free";
  return (
    <span className={`pill ${cls}`} style={{ border: "none", ...style }}>
      {children}
    </span>
  );
}

export function StripePhoto({
  color,
  label,
  ratio = "1 / 1",
  radius = 6,
  style,
  children,
  imageUrl
}: {
  color?: string;
  label?: string;
  ratio?: string;
  radius?: number | string;
  style?: CSSProperties;
  children?: ReactNode;
  imageUrl?: string;
}) {
  return (
    <div
      className="stripe"
      style={{
        aspectRatio: ratio,
        backgroundColor: color,
        borderRadius: radius,
        ...style
      }}
    >
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : null}
      {label && !imageUrl ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 10,
              letterSpacing: ".12em",
              color: "rgba(40,33,26,.5)",
              textTransform: "uppercase"
            }}
          >
            {label}
          </span>
        </div>
      ) : null}
      {children}
    </div>
  );
}

export function Confetti({ style }: { style?: CSSProperties }) {
  const bits: [string, number, number, number][] = [
    ["var(--coral)", 0, 30, 5],
    ["var(--amber)", 18, 10, 4],
    ["var(--p-blue)", 40, 40, 5],
    ["var(--p-green)", 62, 18, 4],
    ["var(--p-lilac)", 82, 38, 5],
    ["var(--coral)", 96, 8, 4],
    ["var(--amber)", 10, 55, 4],
    ["var(--p-blue)", 74, 60, 4]
  ];
  return (
    <div className="confetti" style={{ position: "absolute", inset: 0, pointerEvents: "none", ...style }}>
      {bits.map((b, i) => (
        <i
          key={i}
          style={{
            left: `${b[1]}%`,
            top: `${b[2]}%`,
            width: b[3],
            height: b[3],
            background: b[0],
            transform: `rotate(${i * 40}deg)`
          }}
        />
      ))}
    </div>
  );
}

export function Avatar({ name, color, size = 34 }: { name: string; color?: string; size?: number }) {
  const initials = (name || "?")
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 999,
        background: color || "#E6DDC9",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        fontFamily: "var(--font-sans)",
        fontWeight: 600,
        fontSize: size * 0.38,
        color: "#3a3127"
      }}
    >
      {initials}
    </div>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  full = false
}: {
  options: (T | { v: T; l: string })[];
  value: T;
  onChange: (v: T) => void;
  full?: boolean;
}) {
  return (
    <div
      className={`segmented-control${full ? " is-full" : ""}${options.length >= 4 ? " is-wrap-mobile" : ""}`}
    >
      {options.map((o) => {
        const v = typeof o === "string" ? o : o.v;
        const l = typeof o === "string" ? o : o.l;
        const on = v === value;
        return (
          <button
            key={v}
            type="button"
            onClick={() => onChange(v)}
            className={`segmented-control-btn${on ? " is-active" : ""}`}
          >
            {l}
          </button>
        );
      })}
    </div>
  );
}

export function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      aria-pressed={on}
      style={{
        width: 44,
        height: 26,
        borderRadius: 99,
        border: "none",
        cursor: "pointer",
        padding: 3,
        background: on ? "var(--coral)" : "#D8CFBE",
        transition: "background .2s",
        display: "flex"
      }}
    >
      <span
        style={{
          width: 20,
          height: 20,
          borderRadius: 99,
          background: "#fff",
          transform: on ? "translateX(18px)" : "none",
          transition: "transform .2s",
          boxShadow: "0 1px 3px rgba(0,0,0,.25)"
        }}
      />
    </button>
  );
}

export function Field({
  label,
  span,
  children
}: {
  label: string;
  span?: 2;
  children: ReactNode;
}) {
  return (
    <label style={{ gridColumn: span === 2 ? "1 / -1" : undefined }}>
      <span className="fl">{label}</span>
      {children}
    </label>
  );
}

export function Shimmer({ lines = 3 }: { lines?: number }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="shine" style={{ height: 14, borderRadius: 6, width: i === lines - 1 ? "70%" : "100%" }} />
      ))}
    </div>
  );
}

export function LockedCapsuleView({ onActivate }: { onActivate?: () => void }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 40,
        minHeight: 320
      }}
    >
      <div className="card pop" style={{ maxWidth: 420, padding: "40px 34px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <Confetti style={{ opacity: 0.4 }} />
        <span
          style={{
            width: 60,
            height: 60,
            borderRadius: 99,
            background: "var(--dark)",
            margin: "0 auto 18px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative"
          }}
        >
          <Icon name="lock" size={26} style={{ color: "var(--amber)" }} />
        </span>
        <Mono style={{ color: "var(--coral-deep)" }}>Recurso da Cápsula</Mono>
        <h2 className="serif-i" style={{ fontSize: 28, margin: "10px 0 8px", position: "relative" }}>
          Disponível com a Cápsula
        </h2>
        <p style={{ margin: "0 0 22px", fontSize: 14, color: "var(--ink-2)", lineHeight: 1.5, position: "relative" }}>
          O mural ao vivo, o telão e a cápsula do tempo são liberados ao ativar a Cápsula — R$59 (pagamento único) ou R$197/ano no plano Plus.
        </p>
        {onActivate ? (
          <button type="button" className="btn btn-coral" onClick={onActivate} style={{ position: "relative" }}>
            <Icon name="hourglass" size={16} />
            Ativar Cápsula
          </button>
        ) : null}
      </div>
    </div>
  );
}

export const PASTELS = [
  "var(--p-rose)",
  "var(--p-blue)",
  "var(--p-green)",
  "var(--p-lilac)",
  "var(--p-peach)",
  "var(--p-sand)"
] as const;

export const TAPE_COLORS = ["var(--tape-y)", "var(--tape-c)"] as const;

export function Polaroid({
  color,
  caption,
  tape = "var(--tape-y)",
  rotate = 0,
  label,
  width = 150,
  imageUrl,
  style
}: {
  color?: string;
  caption?: string;
  tape?: string;
  rotate?: number;
  label?: string;
  width?: number | string;
  imageUrl?: string;
  style?: CSSProperties;
}) {
  return (
    <div className="polaroid" style={{ width, transform: `rotate(${rotate}deg)`, ...style }}>
      <div className="tape" style={{ background: tape }} />
      <StripePhoto color={color} label={label} imageUrl={imageUrl} ratio="1 / 1.08" radius={2} />
      {caption ? <div className="cap">{caption}</div> : null}
    </div>
  );
}
