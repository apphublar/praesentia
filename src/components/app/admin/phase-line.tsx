"use client";

import { Icon, type IconName } from "@/components/app/ui/icon";
import { Mono } from "@/components/app/ui/primitives";
import type { AdminPhaseLineId } from "@/lib/app/event-display";

const PHASES: [AdminPhaseLineId, string, IconName][] = [
  ["convite", "Convite", "share"],
  ["confirmacao", "Confirmação", "users"],
  ["festa", "Festa · mural", "camera"],
  ["capsula", "Cápsula", "hourglass"]
];

export function PhaseLine({ current, capsule }: { current: AdminPhaseLineId; capsule: boolean }) {
  const idx = PHASES.findIndex((p) => p[0] === current);

  return (
    <div className="card" style={{ padding: "20px 22px" }}>
      <Mono style={{ display: "block", marginBottom: 16 }}>A linha do evento</Mono>
      <div style={{ display: "flex", alignItems: "flex-start", position: "relative" }}>
        {PHASES.map((p, i) => {
          const done = i < idx;
          const on = i === idx;
          const locked = p[0] === "capsula" && !capsule;
          const icon = locked ? "lock" : p[2];

          return (
            <div key={p[0]} style={{ flex: 1, position: "relative", textAlign: "center" }}>
              {i < PHASES.length - 1 ? (
                <div
                  style={{
                    position: "absolute",
                    top: 18,
                    left: "50%",
                    width: "100%",
                    height: 2,
                    background: done ? "var(--ink)" : "var(--line-2)"
                  }}
                />
              ) : null}
              <div
                style={{
                  position: "relative",
                  width: 38,
                  height: 38,
                  borderRadius: 99,
                  margin: "0 auto 9px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: on ? "var(--coral)" : done ? "var(--ink)" : "var(--card-2)",
                  color: on || done ? "#fff" : locked ? "var(--faint)" : "var(--muted)",
                  border: on || done ? "none" : "1.5px solid var(--line-2)",
                  boxShadow: on ? "0 0 0 5px rgba(242,107,90,.16)" : "none"
                }}
              >
                <Icon name={icon} size={16} />
              </div>
              <div style={{ fontSize: 12, fontWeight: on ? 700 : 500, color: on ? "var(--ink)" : locked ? "var(--faint)" : "var(--muted)" }}>
                {p[1]}
              </div>
              {on ? (
                <div className="mono" style={{ fontSize: 8.5, color: "var(--coral-deep)", marginTop: 3 }}>
                  você está aqui
                </div>
              ) : null}
              {locked ? (
                <div className="mono" style={{ fontSize: 8.5, marginTop: 3 }}>
                  requer cápsula
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
