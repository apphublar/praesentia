export type CreateEventState = {
  eventId?: string;
  error?: string;
  fieldError?: string;
} | null;

export function createEventFieldErrorMessage(fieldError: string | undefined) {
  if (fieldError === "campos-obrigatorios") return "Preencha todos os campos obrigatórios.";
  if (fieldError === "link-online-obrigatorio") return "Informe o link do evento online.";
  if (fieldError === "local-obrigatorio") return "Informe o local completo do evento.";
  if (fieldError === "pix-obrigatorio") return "Informe uma chave Pix válida para a vaquinha.";
  return null;
}
