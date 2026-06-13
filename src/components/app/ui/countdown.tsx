"use client";

import { useEffect, useState } from "react";

export function Countdown({ target, dark = false }: { target: string; dark?: boolean }) {
  function calc() {
    const d = Math.max(0, new Date(target).getTime() - Date.now());
    return {
      d: Math.floor(d / 864e5),
      h: Math.floor(d / 36e5) % 24,
      m: Math.floor(d / 6e4) % 60,
      s: Math.floor(d / 1e3) % 60
    };
  }

  const [t, setT] = useState(calc);

  useEffect(() => {
    const id = setInterval(() => setT(calc()), 1000);
    return () => clearInterval(id);
  }, [target]);

  const col = dark ? "#F4EDDF" : "var(--ink)";

  function cell(v: number, l: string) {
    return (
      <div style={{ textAlign: "center" }}>
        <div
          className="serif"
          style={{ fontSize: 38, fontWeight: 600, color: col, fontVariantNumeric: "tabular-nums", fontStyle: "italic" }}
        >
          {String(v).padStart(2, "0")}
        </div>
        <div className="mono" style={{ fontSize: 9, marginTop: 2, color: dark ? "rgba(244,237,223,.6)" : "var(--muted)" }}>
          {l}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", gap: 18, alignItems: "flex-start", justifyContent: "center" }}>
      {cell(t.d, "dias")}
      {cell(t.h, "horas")}
      {cell(t.m, "min")}
      {cell(t.s, "seg")}
    </div>
  );
}
