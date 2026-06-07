import type { PixSettings } from "@/types/domain";

export function PixBox({ pix }: { pix?: PixSettings }) {
  if (!pix?.enabled) return null;

  return (
    <aside className="card" style={{ padding: 20 }}>
      <span className="pill">contribuição opcional</span>
      <h2 style={{ margin: "14px 0 6px" }}>Pix do evento</h2>
      <p style={{ color: "var(--ink-soft)", lineHeight: 1.5 }}>{pix.message}</p>
      <div style={{ background: "var(--bg-soft)", borderRadius: 8, padding: 14, marginTop: 14 }}>
        <div style={{ fontSize: 12, color: "var(--ink-soft)", fontWeight: 800 }}>Recebedor</div>
        <strong>{pix.receiverName}</strong>
        <div style={{ fontSize: 12, color: "var(--ink-soft)", fontWeight: 800, marginTop: 10 }}>Chave Pix</div>
        <code>{pix.key}</code>
      </div>
      {pix.suggestedAmount && (
        <p style={{ fontSize: 13, color: "var(--ink-soft)" }}>Valor sugerido: R$ {pix.suggestedAmount}</p>
      )}
      <button className="btn" style={{ width: "100%", marginTop: 12 }}>
        Copiar chave Pix
      </button>
    </aside>
  );
}
