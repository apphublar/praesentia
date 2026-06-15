import type { Metadata } from "next";
import { LegalControllerNotice } from "@/components/legal/legal-controller-notice";
import { LegalPageShell } from "@/components/legal/legal-page-shell";
import { LEGAL_CONTACT, LEGAL_UPDATED_AT } from "@/lib/legal/constants";

export const metadata: Metadata = {
  title: "Armazenamento e Cápsula — Praesentia",
  description: "Regras de armazenamento, mural, telão e cápsula do tempo na Praesentia."
};

export default function StorageCapsulePage() {
  return (
    <LegalPageShell
      title="Armazenamento e Cápsula"
      updatedAt={LEGAL_UPDATED_AT}
      currentPath="/armazenamento-capsula"
    >
      <LegalControllerNotice />
      <p>
        Esta Política detalha prazos de guarda, limites de armazenamento e funcionamento do mural ao vivo, telão e
        cápsula do tempo. Complementa os <a href="/termos">Termos de uso</a> e a{" "}
        <a href="/privacidade">Política de Privacidade</a>.
      </p>

      <h2>1. Visão geral dos planos</h2>
      <ul>
        <li>
          <strong>Gratuito:</strong> convite e RSVP ativos durante o evento. Sem cápsula permanente, mural ao vivo ou
          telão após o encerramento.
        </li>
        <li>
          <strong>Cápsula (R$ 59, pagamento único):</strong> ativa mural ao vivo, telão e cápsula do tempo com{" "}
          <strong>5 GB</strong> inclusos e guarda mínima de <strong>36 meses</strong> para aquele evento.
        </li>
        <li>
          <strong>Cápsula Plus (R$ 197/ano):</strong> até <strong>6 eventos por ano</strong>,{" "}
          <strong>20 GB compartilhados</strong> entre eventos ativos no pool e guarda mínima de{" "}
          <strong>36 meses por evento</strong>. Cada cápsula permanece separada e privada.
        </li>
      </ul>
      <p>
        Valores e condições vigentes estão publicados na página de preços. Ativação pode ser feita antes ou durante o
        evento, conforme disponibilidade no painel.
      </p>

      <h2>2. O que conta no armazenamento</h2>
      <p>Entram no cálculo de GB:</p>
      <ul>
        <li>Fotos e vídeos enviados ao mural, telão ou cápsula.</li>
        <li>Mídia anexada a recados e timeline do evento.</li>
        <li>Arquivos gerados ou editados por recursos de IA vinculados ao evento.</li>
      </ul>
      <p>
        Metadados leves (textos, RSVPs, curtidas) consomem espaço mínimo em relação à mídia. O painel do responsável
        exibe uso aproximado em GB.
      </p>

      <h2>3. Ampliação de espaço</h2>
      <p>
        Se o evento ultrapassar o limite contratado, o responsável pode adquirir pacotes extras de{" "}
        <strong>+5, +10, +25 ou +50 GB</strong>. Pacotes vinculam-se ao evento (Cápsula) ou ao pool Plus, conforme o
        plano. Detalhes de reembolso em <a href="/cancelamento-reembolso">Cancelamento e reembolso</a>.
      </p>

      <h2>4. Mural ao vivo e telão</h2>
      <ul>
        <li>O mural permite envio de conteúdos por convidados com RSVP confirmado (salvo configuração diversa).</li>
        <li>O telão exibe seleção controlada pelo responsável para projeção ou tela compartilhada.</li>
        <li>Conteúdos removidos pelo responsável deixam de ser exibidos; cópias já sincronizadas na cápsula seguem
          regras de moderação do evento.</li>
      </ul>

      <h2>5. Cápsula do tempo</h2>
      <p>
        A cápsula reúne memórias do evento (fotos, vídeos, recados, presenças e interações permitidas) em repositório
        privado. Apenas o responsável e pessoas autorizadas por ele acessam a cápsula após o evento. O link da cápsula
        permanece disponível pelo período contratado, com mínimo de 36 meses por evento em planos pagos.
      </p>
      <p>
        Após o prazo, podemos notificar o responsável sobre renovação, exportação ou exclusão programada, conforme
        condições vigentes na data da contratação.
      </p>

      <h2>6. Backups e disponibilidade</h2>
      <p>
        Mantemos cópias de segurança e práticas de redundância na infraestrutura (incluindo armazenamento em Cloudflare
        R2). Não garantimos recuperação de conteúdos excluídos deliberadamente pelo responsável ou perdidos por uso
        incompatível (formatos corrompidos, violação de termos). Recomendamos exportar memórias críticas localmente.
      </p>

      <h2>7. Exclusão e portabilidade</h2>
      <p>
        O responsável pode excluir conteúdos ou solicitar encerramento do evento pelo painel. Pedidos de exportação ou
        eliminação total de dados podem ser feitos a{" "}
        <a href={`mailto:${LEGAL_CONTACT.privacy}`}>{LEGAL_CONTACT.privacy}</a>, observadas retenções legais e prazos
        de backup.
      </p>

      <h2>8. Uso indevido de armazenamento</h2>
      <p>
        É proibido usar a cápsula como hospedagem genérica, backup corporativo ou distribuição de arquivos não
        relacionados ao evento. Conteúdos que violem a <a href="/uso-aceitavel">Política de Uso Aceitável</a> podem ser
        removidos e o espaço liberado sem reembolso proporcional, quando aplicável.
      </p>
    </LegalPageShell>
  );
}
