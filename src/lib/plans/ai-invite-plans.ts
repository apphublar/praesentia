/** Planos avulsos de versões de convite IA (conta gratuita). */
export type AiInviteUpgradePlan = "inspiracao" | "criativo";

export const AI_INVITE_UPGRADE_PLANS = {
  gratuito: {
    id: "gratuito" as const,
    name: "Gratuito",
    tagline: "Ideal para testar a experiência.",
    versions: 1,
    priceLabel: "R$ 0",
    priceBrl: 0,
    cta: "Versão utilizada",
    disabled: true
  },
  inspiracao: {
    id: "inspiracao" as const,
    name: "Inspiração",
    tagline: "Explore novas ideias.",
    versions: 5,
    priceLabel: "R$ 9,90",
    priceBrl: 9.9,
    cta: "Quero explorar mais",
    popular: true
  },
  criativo: {
    id: "criativo" as const,
    name: "Criativo",
    tagline: "Perfeito para comparar diferentes estilos.",
    versions: 15,
    priceLabel: "R$ 29,90",
    priceBrl: 29.9,
    cta: "Encontrar meu convite ideal"
  }
} as const;

/** Máximo de versões por evento quando há pacote avulso ativo. */
export const AI_INVITE_PER_EVENT_MAX = 3;

/** Cápsula (evento único pago). */
export const CAPSULE_AI_COVER_GENERATIONS = 3;

/** Cápsula Plus — total compartilhado entre eventos do ano. */
export const FAMILY_AI_COVER_POOL_TOTAL = 10;

/** Cácsula Plus — máximo por evento. */
export const FAMILY_AI_COVER_PER_EVENT_MAX = 2;
