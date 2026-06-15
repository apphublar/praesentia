import { LEGAL_CONTACT, LEGAL_CONTROLLER } from "@/lib/legal/constants";

export function LegalControllerNotice() {
  return (
    <p>
      O controlador dos dados e responsável pela plataforma Praesentia é o <strong>{LEGAL_CONTROLLER.name}</strong>, inscrito
      no CNPJ {LEGAL_CONTROLLER.cnpj}, com sede em {LEGAL_CONTROLLER.address}. Dúvidas gerais:{" "}
      <a href={`mailto:${LEGAL_CONTACT.general}`}>{LEGAL_CONTACT.general}</a>. Privacidade e LGPD:{" "}
      <a href={`mailto:${LEGAL_CONTACT.privacy}`}>{LEGAL_CONTACT.privacy}</a>.
    </p>
  );
}
