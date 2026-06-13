import type { ReactNode } from "react";
import { Toggle } from "@/components/app/ui/primitives";

export function ConfBlock({ title, desc, children }: { title: string; desc: string; children: ReactNode }) {
  return (
    <div className="card" style={{ padding: "20px 22px", marginBottom: 16 }}>
      <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>{title}</h3>
      <p style={{ margin: "4px 0 16px", fontSize: 13, color: "var(--muted)" }}>{desc}</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>{children}</div>
    </div>
  );
}

export function Field2({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <span className="fl">{label}</span>
      {children}
    </div>
  );
}

export function ConfigRow({
  label,
  on,
  onChange
}: {
  label: string;
  on: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0" }}>
      <span style={{ fontSize: 13, color: "var(--ink-2)" }}>{label}</span>
      <Toggle on={on} onChange={onChange} />
    </div>
  );
}
