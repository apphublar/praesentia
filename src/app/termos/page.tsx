import type { Metadata } from "next";
import { LegalControllerNotice } from "@/components/legal/legal-controller-notice";
import { LegalPageShell } from "@/components/legal/legal-page-shell";
import { LEGAL_CONTACT, LEGAL_UPDATED_AT } from "@/lib/legal/constants";

export const metadata: Metadata = {
  title: "Termos de uso — Praesentia",
  description: "Termos de uso da plataforma Praesentia para eventos particulares, mural ao vivo e cápsulas digitais."
};

export default function TermsPage() {
  return (
    <LegalPageShell title="Termos de uso" updatedAt={LEGAL_UPDATED_AT} currentPath="/termos">
      <LegalControllerNotice />
      <p>
        Estes Termos regem o acesso e o uso da Praesentia por responsáveis de eventos, convidados e visitantes. Ao criar
        conta, organizar evento, confirmar presença ou enviar conteúdo, você declara ter lido e concordado com estas
        condições, com a{" "}
        <a href="/privacidade">Política de Privacidade</a>, com a{" "}
        <a href="/uso-aceitavel">Política de Uso Aceitável</a> e, quando aplicável, com a{" "}
        <a href="/armazenamento-capsula">Política de Armazenamento e Cápsula</a>.
      </p>

      <h2>1. Definições</h2>
      <ul>
        <li>
          <strong>Responsável:</strong> pessoa que cria e administra o evento na plataforma.
        </li>
        <li>
          <strong>Convidado:</strong> pessoa convidada ao evento, com acesso conforme regras definidas pelo responsável.
        </li>
        <li>
          <strong>Evento:</strong> página digital com convite, RSVP, mural, telão e/ou cápsula do tempo.
        </li>
        <li>
          <strong>Cápsula:</strong> repositório privado e durável de memórias do evento, ativado mediante plano pago.
        </li>
        <li>
          <strong>Conteúdo:</strong> textos, fotos, vídeos, recados, confirmações de presença e demais materiais enviados
          pelos usuários.
        </li>
      </ul>

      <h2>2. O serviço</h2>
      <p>
        A Praesentia oferece ferramentas para convites digitais, confirmação de presença (RSVP), mural ao vivo, exibição
        em telão, moderação de conteúdos, cápsulas do tempo privadas, recursos de IA para convites (quando disponíveis) e
        gestão de armazenamento conforme o plano. Funcionalidades, limites de espaço e prazos de guarda variam conforme o
        plano contratado e estão descritos no site e na{" "}
        <a href="/armazenamento-capsula">Política de Armazenamento e Cápsula</a>.
      </p>
      <p>
        O plano gratuito permanece ativo durante o evento e não inclui cápsula permanente. Mural ao vivo, telão e cápsula
        exigem ativação da Cápsula ou do plano Cápsula Plus, conforme informado no momento da contratação.
      </p>

      <h2>3. Cadastro e elegibilidade</h2>
      <p>
        Para usar a plataforma como responsável, você deve ter capacidade civil e fornecer informações verdadeiras. Você
        é responsável pela confidencialidade da sua senha e por todas as ações realizadas na sua conta. Notifique-nos
        imediatamente em caso de uso não autorizado.
      </p>

      <h2>4. Papel do responsável</h2>
      <p>
        O responsável pelo evento define convidados, regras de acesso, modera conteúdos publicados no mural e decide o que
        permanece visível no telão e na cápsula. O responsável também garante possuir autorização para usar imagens, nomes e
        dados dos participantes, inclusive de crianças e adolescentes, nos termos da legislação aplicável.
      </p>
      <p>
        Convidados só publicam no mural após confirmação de presença (RSVP), salvo configuração diversa definida pelo
        responsável. O responsável pode remover conteúdos, bloquear participantes e encerrar o evento a qualquer momento.
      </p>

      <h2>5. Conteúdos e direitos de terceiros</h2>
      <p>
        Você mantém a titularidade dos conteúdos que envia. Ao publicar na Praesentia, você concede licença limitada,
        não exclusiva e revogável para que a plataforma armazene, reproduza, exiba e processe esse material apenas para
        operar o serviço contratado (incluindo mural, telão, cápsula, backups e recursos de IA solicitados pelo
        responsável). Essa licença não autoriza uso comercial da Praesentia sobre o seu conteúdo fora do escopo do
        evento.
      </p>
      <p>
        É proibido enviar conteúdo ilegal, difamatório, que viole direitos de imagem, privacidade ou propriedade
        intelectual de terceiros. Consulte a <a href="/uso-aceitavel">Política de Uso Aceitável</a> para exemplos de
        condutas vedadas.
      </p>

      <h2>6. Mural, telão e moderação</h2>
      <p>
        O mural ao vivo permite que convidados compartilhem fotos, vídeos e recados durante o evento. O telão exibe
        conteúdos selecionados pelo responsável para projeção ou tela compartilhada. A Praesentia pode aplicar filtros
        automáticos e ferramentas de moderação, mas a revisão final e a decisão sobre exibição pública são do responsável.
      </p>
      <p>
        A Praesentia pode remover ou restringir conteúdos que violem estes Termos, a lei ou ordem de autoridade, ou
        mediante solicitação fundamentada do responsável ou de titular de direitos.
      </p>

      <h2>7. Planos, preços e pagamentos</h2>
      <p>
        Planos, preços e condições vigentes estão publicados no site. Pagamentos são processados pela Stripe. Ao
        contratar, você concorda com o valor informado no checkout e com a{" "}
        <a href="/cancelamento-reembolso">Política de Cancelamento e Reembolso</a>.
      </p>
      <p>
        Valores podem ser atualizados para novas contratações. Alterações não afetam compras já concluídas, salvo
        renovação expressa ou contratação de serviços adicionais.
      </p>

      <h2>8. Recursos de inteligência artificial</h2>
      <p>
        Quando disponíveis, recursos de IA (como sugestões de texto para convites ou tratamento de foto do homenageado)
        são opcionais e operados mediante processadores terceiros (por exemplo, OpenAI). Resultados podem conter
        imprecisões; o responsável deve revisar antes de publicar. Não envie dados sensíveis desnecessários aos recursos
        de IA.
      </p>

      <h2>9. Disponibilidade e armazenamento</h2>
      <p>
        Empregamos boas práticas de infraestrutura e backup, sem garantia de disponibilidade ininterrupta ou livre de
        falhas. Prazos de guarda, limites de armazenamento e regras de exclusão estão na{" "}
        <a href="/armazenamento-capsula">Política de Armazenamento e Cápsula</a>.
      </p>
      <p>
        Recomendamos que o responsável exporte ou faça cópias locais de memórias especialmente importantes. A Praesentia
        não substitui arquivo pessoal ou backup offline.
      </p>

      <h2>10. Suspensão e encerramento</h2>
      <p>
        Podemos suspender ou encerrar contas e eventos em caso de violação destes Termos, fraude, abuso, inadimplência
        ou ordem legal. O responsável pode encerrar sua conta ou solicitar exclusão de dados conforme a{" "}
        <a href="/privacidade">Política de Privacidade</a>, observadas obrigações legais de retenção.
      </p>

      <h2>11. Limitação de responsabilidade</h2>
      <p>
        Na máxima extensão permitida pela lei, a Praesentia não se responsabiliza por perdas indiretas, lucros cessantes,
        interrupções causadas por terceiros, conteúdos publicados por usuários ou uso indevido da plataforma. Quando
        aplicável, a responsabilidade total limita-se ao valor efetivamente pago pelo serviço objeto da reclamação nos
        últimos 12 meses anteriores ao fato.
      </p>
      <p>
        Nada nestes Termos exclui direitos irrenunciáveis do consumidor previstos no Código de Defesa do Consumidor.
      </p>

      <h2>12. Alterações</h2>
      <p>
        Podemos atualizar estes Termos. Mudanças relevantes serão comunicadas por e-mail ou aviso no painel. A data no
        topo indica a versão vigente. O uso continuado após a vigência constitui aceite, salvo direito de encerramento
        previsto em lei.
      </p>

      <h2>13. Lei aplicável e foro</h2>
      <p>
        Estes Termos são regidos pelas leis da República Federativa do Brasil. Fica eleito o foro da Comarca de São
        Paulo/SP, com renúncia a qualquer outro, por mais privilegiado que seja, salvo disposição legal em contrário
        aplicável ao consumidor.
      </p>

      <h2>14. Contato</h2>
      <p>
        Dúvidas sobre estes Termos:{" "}
        <a href={`mailto:${LEGAL_CONTACT.general}`}>{LEGAL_CONTACT.general}</a>
      </p>
    </LegalPageShell>
  );
}
