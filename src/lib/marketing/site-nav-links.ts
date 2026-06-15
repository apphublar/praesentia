export const SITE_NAV_LINKS = [
  { href: "/#como-funciona", label: "Como funciona" },
  { href: "/#diferencial", label: "Histórias" },
  { href: "/#precos", label: "Preços" },
  { href: "/eu", label: "Meu perfil" },
  { href: "/login", label: "Entrar" }
] as const;

export const SITE_CTA = { href: "/criar", label: "Criar grátis" } as const;

export const DEMO_EVENT_SLUG = "mavie-1-ano" as const;
export const DEMO_INVITE_HREF = `/evento/${DEMO_EVENT_SLUG}` as const;
export const DEMO_INVITE_LABEL = "Ver link do convite" as const;
