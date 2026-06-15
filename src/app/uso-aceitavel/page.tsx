import type { Metadata } from "next";
import { LegalControllerNotice } from "@/components/legal/legal-controller-notice";
import { LegalPageShell } from "@/components/legal/legal-page-shell";
import { LEGAL_CONTACT, LEGAL_UPDATED_AT } from "@/lib/legal/constants";

export const metadata: Metadata = {
  title: "Uso aceitável — Praesentia",
  description: "Regras de conduta e conteúdos permitidos na plataforma Praesentia."
};

export default function AcceptableUsePage() {
  return (
    <LegalPageShell title="Uso aceitável" updatedAt={LEGAL_UPDATED_AT} currentPath="/uso-aceitavel">
      <LegalControllerNotice />
      <p>
        Esta Política define condutas permitidas e proibidas na Praesentia. Violações podem resultar em remoção de
        conteúdo, suspensão de conta ou encerramento de evento, sem prejuízo de medidas legais. Complementa os{" "}
        <a href="/termos">Termos de uso</a>.
      </p>

      <h2>1. Uso permitido</h2>
      <p>
        A Praesentia destina-se a eventos particulares e celebrações familiares: convites, confirmação de presença,
        compartilhamento de memórias no mural, exibição em telão e guarda na cápsula do tempo, sempre com respeito à
        privacidade dos participantes.
      </p>

      <h2>2. Conteúdos proibidos</h2>
      <p>É vedado publicar, enviar ou disponibilizar conteúdo que:</p>
      <ul>
        <li>Seja ilegal, difamatório, ameaçador, odioso ou que incite violência ou discriminação.</li>
        <li>Viole direitos de imagem, voz, privacidade ou propriedade intelectual de terceiros.</li>
        <li>Exponha crianças ou adolescentes de forma inadequada ou sem consentimento dos responsáveis legais.</li>
        <li>Contenha nudez não consentida, pornografia ou material sexual envolvendo menores.</li>
        <li>Promova spam, phishing, malware ou tentativas de fraude.</li>
        <li>Utilize a plataforma para fins comerciais não autorizados, scraping massivo ou sobrecarga intencional dos
          sistemas.</li>
        <li>Burlar moderação, acessar eventos privados sem autorização ou se passar por outra pessoa.</li>
      </ul>

      <h2>3. Mural e telão</h2>
      <p>
        Conteúdos exibidos ao vivo ou em telão devem ser adequados ao contexto familiar do evento. O responsável deve
        moderar publicações antes ou durante a exibição pública. A Praesentia pode aplicar limites técnicos (tamanho de
        arquivo, formatos) e bloquear envios que comprometam segurança ou desempenho.
      </p>

      <h2>4. IA e materiais gerados</h2>
      <p>
        Recursos de inteligência artificial não devem ser usados para criar conteúdo enganoso, difamatório ou que
        reproduza identidade de terceiros sem autorização. O responsável revisa e aprova qualquer material gerado antes
        de publicar.
      </p>

      <h2>5. Denúncias e moderação</h2>
      <p>
        Responsáveis podem remover conteúdos e bloquear convidados pelo painel do evento. Titulares de direitos ou
        participantes afetados podem reportar abusos para{" "}
        <a href={`mailto:${LEGAL_CONTACT.general}`}>{LEGAL_CONTACT.general}</a>, informando URL do evento, descrição
        do problema e, quando possível, capturas ou identificação do conteúdo.
      </p>
      <p>
        Analisaremos denúncias em prazo razoável e cooperaremos com autoridades quando exigido por lei.
      </p>

      <h2>6. Consequências</h2>
      <p>
        Dependendo da gravidade e reincidência, podemos remover conteúdos, restringir funcionalidades, suspender contas
        ou encerrar eventos. Em casos graves (exploração infantil, ameaças, fraude), a conta pode ser encerrada
        imediatamente e o fato reportado às autoridades competentes.
      </p>
    </LegalPageShell>
  );
}
