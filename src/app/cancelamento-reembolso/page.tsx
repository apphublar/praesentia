import type { Metadata } from "next";
import { LegalControllerNotice } from "@/components/legal/legal-controller-notice";
import { LegalPageShell } from "@/components/legal/legal-page-shell";
import { LEGAL_CONTACT, LEGAL_UPDATED_AT } from "@/lib/legal/constants";

export const metadata: Metadata = {
  title: "Cancelamento e reembolso — Praesentia",
  description: "Política de cancelamento, arrependimento e reembolso dos planos Praesentia."
};

export default function CancellationRefundPage() {
  return (
    <LegalPageShell
      title="Cancelamento e reembolso"
      updatedAt={LEGAL_UPDATED_AT}
      currentPath="/cancelamento-reembolso"
    >
      <LegalControllerNotice />
      <p>
        Esta Política regula cancelamentos, direito de arrependimento e reembolsos de planos pagos da Praesentia,
        incluindo Cápsula, Cápsula Plus e pacotes de armazenamento extra. Complementa os{" "}
        <a href="/termos">Termos de uso</a>.
      </p>

      <h2>1. Forma de pagamento</h2>
      <p>
        Pagamentos são processados pela Stripe (cartão de crédito e demais meios disponíveis no checkout). A confirmação
        do pagamento libera as funcionalidades contratadas conforme o plano escolhido.
      </p>

      <h2>2. Direito de arrependimento (CDC)</h2>
      <p>
        Compras realizadas pela internet por consumidor pessoa física podem ser canceladas em até <strong>7 (sete) dias
        corridos</strong> a contar da contratação ou do recebimento do serviço, o que ocorrer por último, nos termos do
        art. 49 do Código de Defesa do Consumidor, desde que o serviço ainda não tenha sido integralmente consumido ou
        personalizado de forma irreversível.
      </p>
      <p>
        Se você solicitou ativação imediata da cápsula, mural ou telão e já utilizou substancialmente o serviço dentro
        desse prazo, poderemos deduzir valor proporcional ao uso, conforme permitido pela legislação aplicável.
      </p>

      <h2>3. Cápsula (pagamento único)</h2>
      <ul>
        <li>Ativa mural ao vivo, telão e cápsula do tempo do evento com 5 GB inclusos e guarda mínima de 36 meses.</li>
        <li>Reembolso integral dentro do prazo de arrependimento, se elegível conforme a seção 2.</li>
        <li>Após o prazo legal, não há reembolso automático por desistência, salvo falha comprovada da plataforma em
          entregar o serviço contratado.</li>
      </ul>

      <h2>4. Cápsula Plus (assinatura anual)</h2>
      <ul>
        <li>Inclui até 6 eventos por ano, 20 GB compartilhados entre eventos ativos e guarda mínima de 36 meses por
          evento.</li>
        <li>Cancelamento impede novas renovações; o acesso permanece até o fim do período já pago.</li>
        <li>Reembolso proporcional ou integral pode ser analisado dentro do prazo de arrependimento ou em caso de
          cobrança indevida.</li>
      </ul>

      <h2>5. Armazenamento extra</h2>
      <p>
        Pacotes adicionais (+5, +10, +25 ou +50 GB) são consumidos ao serem contratados e vinculados ao evento ou pool
        Plus. Reembolso após liberação do espaço segue as mesmas regras de arrependimento e uso proporcional da seção 2.
      </p>

      <h2>6. Como solicitar</h2>
      <p>
        Envie e-mail para{" "}
        <a href={`mailto:${LEGAL_CONTACT.general}`}>{LEGAL_CONTACT.general}</a> informando:
      </p>
      <ul>
        <li>Nome e e-mail da conta.</li>
        <li>Evento ou pedido (número da transação Stripe, se disponível).</li>
        <li>Motivo da solicitação (arrependimento, cobrança duplicada, falha de serviço).</li>
      </ul>
      <p>
        Analisaremos em até 5 dias úteis e, quando aprovado, o reembolso será processado pelo mesmo meio de pagamento,
        podendo levar dias adicionais conforme a operadora do cartão.
      </p>

      <h2>7. Exclusões e chargebacks</h2>
      <p>
        Chargebacks abertos sem contato prévio podem resultar em suspensão temporária da conta enquanto a disputa é
        analisada. Preferimos resolver diretamente pelo canal de suporte.
      </p>

      <h2>8. Eventos gratuitos</h2>
      <p>
        O plano gratuito não envolve cobrança. Você pode encerrar ou excluir o evento a qualquer momento pelo painel;
        dados serão tratados conforme a <a href="/privacidade">Política de Privacidade</a>.
      </p>
    </LegalPageShell>
  );
}
