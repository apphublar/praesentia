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
    <div className="card phase-line">
      <Mono style={{ display: "block", marginBottom: 16 }}>A linha do evento</Mono>
      <div className="phase-line-track">
        {PHASES.map((p, i) => {
          const done = i < idx;
          const on = i === idx;
          const locked = p[0] === "capsula" && !capsule;
          const icon = locked ? "lock" : p[2];

          return (
            <div key={p[0]} className="phase-line-step">
              {i < PHASES.length - 1 ? (
                <div className={`phase-line-connector${done ? " is-done" : ""}`} />
              ) : null}
              <div
                className={`phase-line-icon${on ? " is-active" : ""}${done ? " is-done" : ""}${locked ? " is-locked" : ""}`}
              >
                <Icon name={icon} size={16} />
              </div>
              <div className={`phase-line-label${on ? " is-active" : ""}${locked ? " is-locked" : ""}`}>{p[1]}</div>
              {on ? <div className="mono phase-line-hint phase-line-hint-active">você está aqui</div> : null}
              {locked ? <div className="mono phase-line-hint">requer cápsula</div> : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
