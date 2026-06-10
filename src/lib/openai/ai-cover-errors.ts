export class PublicAiCoverError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PublicAiCoverError";
  }
}

export function toPublicCoverImageErrorMessage(status: number, detail?: string) {
  if (status === 429) {
    return "Muitas solicitações agora. Aguarde alguns segundos e tente novamente.";
  }
  if (status >= 500) {
    return "Serviço de imagem indisponível no momento. Tente novamente em instantes.";
  }
  if (detail?.trim()) {
    return "Não foi possível criar a imagem agora. Tente novamente ou envie sua própria imagem.";
  }
  return "Não foi possível criar a imagem agora. Tente novamente em instantes.";
}
