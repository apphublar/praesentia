export function shouldPromptCoverUpgrade(error: string) {
  const normalized = error.toLowerCase();
  return (
    normalized.includes("limite de tentativas") ||
    normalized.includes("limite de gerações") ||
    normalized.includes("limite de ajustes") ||
    normalized.includes("versão gratuita já foi usada") ||
    normalized.includes("pacote de versões") ||
    normalized.includes("explore novos estilos com um pacote")
  );
}
