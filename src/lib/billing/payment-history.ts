export const BILLING_AUDIT_ACTIONS = [
  "event.capsule_activated",
  "subscription.activated",
  "subscription.storage_expanded",
  "event.storage_expanded",
  "event.ai_cover_pack_purchased",
  "event.ai_invite_plan_purchased",
  "event.album_purchased"
] as const;

export type BillingAuditAction = (typeof BILLING_AUDIT_ACTIONS)[number];

export type AuditLogRow = {
  id: string;
  actorUserId: string | null;
  eventId: string | null;
  action: string;
  targetType: string;
  targetId: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
};

export type PaymentHistoryItem = {
  id: string;
  action: string;
  title: string;
  description: string;
  amountLabel: string;
  status: "paid" | "included";
  eventId: string | null;
  eventTitle: string | null;
  createdAt: string;
};

function formatBrl(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function priceFromMetadata(metadata: Record<string, unknown>, fallback = 0) {
  const raw = metadata.priceBrl;
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  return fallback;
}

export function mapAuditLogToPayment(row: AuditLogRow, eventTitle?: string | null): PaymentHistoryItem | null {
  const metadata = row.metadata ?? {};
  const devMode = metadata.devMode === true;

  switch (row.action as BillingAuditAction) {
    case "event.capsule_activated": {
      const plan = metadata.plan === "family" ? "family" : "capsule";
      if (plan === "family") {
        return {
          id: row.id,
          action: row.action,
          title: "Cápsula ativada no evento",
          description: "Incluída no plano Cápsula Plus",
          amountLabel: "Incluído no plano",
          status: "included",
          eventId: row.eventId,
          eventTitle: eventTitle ?? null,
          createdAt: row.createdAt
        };
      }
      return {
        id: row.id,
        action: row.action,
        title: "Cápsula do tempo",
        description: devMode ? "Ativação em ambiente de teste" : "Pagamento único · memórias permanentes",
        amountLabel: typeof metadata.priceLabel === "string" ? metadata.priceLabel : formatBrl(priceFromMetadata(metadata, 59)),
        status: "paid",
        eventId: row.eventId,
        eventTitle: eventTitle ?? null,
        createdAt: row.createdAt
      };
    }
    case "subscription.activated":
      return {
        id: row.id,
        action: row.action,
        title: "Cápsula Plus",
        description: devMode ? "Assinatura em ambiente de teste" : "Plano anual · até 6 eventos",
        amountLabel: typeof metadata.priceLabel === "string" ? metadata.priceLabel : formatBrl(priceFromMetadata(metadata, 197)),
        status: "paid",
        eventId: null,
        eventTitle: null,
        createdAt: row.createdAt
      };
    case "subscription.storage_expanded":
    case "event.storage_expanded": {
      const gb = typeof metadata.gb === "number" ? metadata.gb : null;
      return {
        id: row.id,
        action: row.action,
        title: "Ampliação de armazenamento",
        description: gb ? `+${gb} GB ${row.action === "subscription.storage_expanded" ? "no pool Plus" : "neste evento"}` : "Espaço extra contratado",
        amountLabel:
          typeof metadata.priceLabel === "string"
            ? metadata.priceLabel
            : formatBrl(priceFromMetadata(metadata, gb === 5 ? 19 : gb === 10 ? 29 : gb === 25 ? 49 : gb === 50 ? 89 : 0)),
        status: "paid",
        eventId: row.eventId,
        eventTitle: eventTitle ?? null,
        createdAt: row.createdAt
      };
    }
    case "event.ai_cover_pack_purchased":
      return {
        id: row.id,
        action: row.action,
        title: "Pacote extra de convite IA",
        description: "Imagens e ajustes adicionais para a capa",
        amountLabel: typeof metadata.priceLabel === "string" ? metadata.priceLabel : "R$ 4,90",
        status: "paid",
        eventId: row.eventId,
        eventTitle: eventTitle ?? null,
        createdAt: row.createdAt
      };
    case "event.ai_invite_plan_purchased": {
      const plan = metadata.plan === "criativo" ? "Criativo" : "Inspiração";
      return {
        id: row.id,
        action: row.action,
        title: `Pacote ${plan} · versões de convite`,
        description: devMode ? "Ativação em ambiente de teste" : "Versões extras para explorar estilos de convite",
        amountLabel: typeof metadata.priceLabel === "string" ? metadata.priceLabel : formatBrl(priceFromMetadata(metadata, 9.9)),
        status: "paid",
        eventId: row.eventId,
        eventTitle: eventTitle ?? null,
        createdAt: row.createdAt
      };
    }
    case "event.album_purchased": {
      const pages = typeof metadata.pageCount === "number" ? metadata.pageCount : null;
      return {
        id: row.id,
        action: row.action,
        title: "Álbum de fotos impresso",
        description: pages ? `${pages} páginas · 30×30 cm capa dura` : "Álbum físico Praesentia",
        amountLabel: typeof metadata.priceLabel === "string" ? metadata.priceLabel : formatBrl(priceFromMetadata(metadata, 170)),
        status: "paid",
        eventId: row.eventId,
        eventTitle: eventTitle ?? null,
        createdAt: row.createdAt
      };
    }
    default:
      return null;
  }
}
