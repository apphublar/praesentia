"use client";

import { Icon } from "@/components/app/ui/icon";
import { Mono } from "@/components/app/ui/primitives";

export type PlanId = "free" | "cap" | "plus";

export const CREATE_PLANS = [
  {
    id: "free" as const,
    name: "Gratuito",
    eyebrow: "Plano · Gratuito",
    desc: "Comece hoje, valide o convite e organize presenças.",
    price: "R$0",
    unit: "sem cartão",
    cta: "Começar grátis",
    dark: false,
    groups: [
      {
        h: "Convite & RSVP",
        items: [
          "1 convite com IA + texto + assistente de prompt",
          "Pacote extra R$4,90: +2 imagens e +2 ajustes",
          "Link do domínio Praesentia",
          "Lista de convidados",
          "Confirmação de presença"
        ]
      },
      { h: "Durante o evento", items: ["Pix opcional para contribuição", "Página do evento temporária", "Sem cápsula permanente"] }
    ]
  },
  {
    id: "cap" as const,
    name: "Cápsula",
    eyebrow: "Plano · Cápsula",
    desc: "Transforme um evento em uma memória permanente.",
    price: "R$59",
    unit: "pagamento único",
    cta: "Eternizar minha memória",
    dark: true,
    badge: "Mais escolhido",
    groups: [
      { h: "Convite & RSVP", items: ["Tudo do Gratuito", "Subdomínio pago do evento", "IA premium para convite"] },
      {
        h: "Memórias permanentes",
        items: ["Cápsula do tempo", "Timeline do evento", "Fotos, vídeos e recados", "Exportação das memórias"]
      },
      { h: "Armazenamento", items: ["5 GB inclusos", "36 meses de armazenamento"] }
    ]
  },
  {
    id: "plus" as const,
    name: "Cápsula Plus",
    eyebrow: "Plano · Cápsula Plus",
    desc: "Sua história organizada em uma única timeline.",
    price: "R$197",
    unit: "por ano",
    cta: "Quero a timeline",
    dark: false,
    groups: [
      { h: "Eventos", items: ["Tudo do Cápsula", "Até 6 eventos por ano", "Timeline conectada"] },
      {
        h: "Memórias permanentes",
        items: ["Cápsulas conectadas", "Fotos, vídeos e recados", "Exportação das memórias"]
      },
      { h: "Armazenamento", items: ["20 GB compartilhados", "36 meses para cada evento"] }
    ]
  }
];

export function PlanCard({
  plan,
  selected,
  onSelect
}: {
  plan: (typeof CREATE_PLANS)[number];
  selected: boolean;
  onSelect: () => void;
}) {
  const dark = plan.dark;
  const txt = dark ? "var(--paper)" : "var(--ink)";
  const sub = dark ? "rgba(244,237,223,.55)" : "var(--muted)";
  const featCol = dark ? "rgba(244,237,223,.85)" : "var(--ink-2)";
  const check = dark ? "var(--amber)" : "var(--coral)";

  return (
    <button
      type="button"
      onClick={onSelect}
      style={{ textAlign: "left", cursor: "pointer", padding: 0, border: "none", background: "transparent", height: "100%", width: "100%" }}
    >
      <div
        className="card"
        style={{
          padding: "22px 18px 20px",
          height: "100%",
          position: "relative",
          borderColor: selected ? (dark ? "var(--coral)" : "var(--ink)") : "var(--line)",
          borderWidth: selected ? 2 : 1,
          boxShadow: selected ? "0 18px 40px -18px rgba(34,27,20,.32)" : "var(--shadow-card)",
          background: dark ? "var(--dark)" : "var(--card)",
          display: "flex",
          flexDirection: "column"
        }}
      >
        {"badge" in plan && plan.badge ? (
          <span
            style={{
              position: "absolute",
              top: -10,
              left: "50%",
              transform: "translateX(-50%)",
              background: "var(--amber)",
              color: "#3a2a07",
              fontFamily: "var(--font-mono)",
              fontSize: 8.5,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: ".1em",
              padding: "4px 12px",
              borderRadius: 99,
              whiteSpace: "nowrap"
            }}
          >
            {plan.badge}
          </span>
        ) : null}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <Mono style={{ color: sub }}>{plan.eyebrow}</Mono>
          <span
            style={{
              width: 20,
              height: 20,
              borderRadius: 99,
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: `2px solid ${selected ? "var(--coral)" : dark ? "#4a4136" : "var(--line-2)"}`,
              background: selected ? "var(--coral)" : "transparent"
            }}
          >
            {selected ? <Icon name="check" size={11} sw={3} style={{ color: "#fff" }} /> : null}
          </span>
        </div>
        <h3 className="serif-i" style={{ fontSize: 25, marginTop: 6, color: txt }}>
          {plan.name}
        </h3>
        <p style={{ margin: "7px 0 0", fontSize: 12.5, color: sub, lineHeight: 1.45, minHeight: 36 }}>{plan.desc}</p>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 6,
            margin: "16px 0 2px",
            paddingTop: 16,
            borderTop: `1px solid ${dark ? "var(--dark-line)" : "var(--line)"}`
          }}
        >
          <span className="serif" style={{ fontSize: 31, fontWeight: 600, color: txt }}>
            {plan.price}
          </span>
          <span className="mono" style={{ color: sub }}>
            {plan.unit}
          </span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 13, marginTop: 16, flex: 1 }}>
          {plan.groups.map((g) => (
            <div key={g.h}>
              <Mono style={{ color: sub, fontSize: 8.5, display: "block", marginBottom: 7 }}>
                {g.h}
              </Mono>
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                {g.items.map((x) => (
                  <div key={x} style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 12, color: featCol, lineHeight: 1.35 }}>
                    <Icon name="check" size={13} sw={2.4} style={{ color: check, flexShrink: 0, marginTop: 1 }} />
                    {x}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className={`btn ${dark ? "btn-amber" : selected ? "btn-coral" : "btn-ghost"}`} style={{ marginTop: 18, width: "100%", pointerEvents: "none" }}>
          {plan.cta}
        </div>
      </div>
    </button>
  );
}
