/** Estimativas conservadoras de custo OpenAI (USD) para painel operacional. */
export const AI_COST_USD = {
  coverGeneration: 0.09,
  coverEdit: 0.07,
  textGeneration: 0.002,
  textEdit: 0.001
} as const;

export function estimateAiCostUsd(input: {
  coverGenerations: number;
  coverEdits: number;
  textGenerations: number;
  textEdits?: number;
}) {
  return (
    input.coverGenerations * AI_COST_USD.coverGeneration +
    input.coverEdits * AI_COST_USD.coverEdit +
    input.textGenerations * AI_COST_USD.textGeneration +
    (input.textEdits ?? 0) * AI_COST_USD.textEdit
  );
}

export function formatUsd(value: number) {
  return value.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 });
}

export function formatBrl(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export const ADMIN_EXTERNAL_LINKS = {
  openAiUsage: "https://platform.openai.com/usage",
  openAiApiKeys: "https://platform.openai.com/api-keys",
  stripeDashboard: "https://dashboard.stripe.com",
  supabaseDashboard: "https://supabase.com/dashboard"
} as const;

export const ADMIN_NAV = [
  { href: "/admin", label: "Visão geral", exact: true },
  { href: "/admin/clientes", label: "Clientes" },
  { href: "/admin/cobranca", label: "Cobrança" },
  { href: "/admin/ia", label: "Inteligência artificial" },
  { href: "/admin/configuracoes", label: "Configurações" }
] as const;
