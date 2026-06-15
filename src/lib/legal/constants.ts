export const LEGAL_UPDATED_AT = "junho de 2026";

export const LEGAL_CONTROLLER = {
  name: "Grupo CAPACARD",
  cnpj: "40.568.145/0001-08",
  address: "Avenida Paulista, 1636, Conj 4 Pavmto 15, Bela Vista, São Paulo/SP, CEP 01310-200"
} as const;

export const LEGAL_CONTACT = {
  general: "contato@praesentia.com.br",
  privacy: "privacidade@praesentia.com.br"
} as const;

export const LEGAL_PAGES = [
  { href: "/termos", label: "Termos de uso" },
  { href: "/privacidade", label: "Privacidade" },
  { href: "/armazenamento-capsula", label: "Armazenamento e Cápsula" },
  { href: "/cancelamento-reembolso", label: "Cancelamento e reembolso" },
  { href: "/uso-aceitavel", label: "Uso aceitável" },
  { href: "/cookies", label: "Cookies" }
] as const;
