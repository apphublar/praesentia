import type { Metadata } from "next";
import { LegalControllerNotice } from "@/components/legal/legal-controller-notice";
import { LegalPageShell } from "@/components/legal/legal-page-shell";
import { LEGAL_CONTACT, LEGAL_UPDATED_AT } from "@/lib/legal/constants";

export const metadata: Metadata = {
  title: "Política de privacidade — Praesentia",
  description: "Como a Praesentia trata dados pessoais em eventos particulares, mural ao vivo e cápsulas digitais."
};

export default function PrivacyPage() {
  return (
    <LegalPageShell title="Política de privacidade" updatedAt={LEGAL_UPDATED_AT} currentPath="/privacidade">
      <LegalControllerNotice />
      <p>
        Esta Política descreve como tratamos dados pessoais na Praesentia, em conformidade com a Lei Geral de Proteção
        de Dados (LGPD — Lei 13.709/2018). Ao usar a plataforma, você declara ciência desta Política e dos{" "}
        <a href="/termos">Termos de uso</a>.
      </p>

      <h2>1. Papéis no tratamento</h2>
      <p>
        O <strong>Grupo CAPACARD</strong> atua como controlador dos dados tratados para operar a plataforma, cobrança,
        suporte, segurança e cumprimento legal. O <strong>responsável pelo evento</strong> define convidados, publica
        informações do evento e pode incluir dados de terceiros (participantes e familiares); nesses casos, o responsável
        também pode ser co-responsável ou operador conforme a natureza do dado e a finalidade, devendo possuir base legal
        para compartilhar tais informações conosco.
      </p>

      <h2>2. Dados que coletamos</h2>
      <ul>
        <li>
          <strong>Conta:</strong> nome, e-mail, credenciais de acesso e preferências de comunicação.
        </li>
        <li>
          <strong>Evento:</strong> título, data, local, descrição, lista de convidados, RSVPs, mensagens, curtidas,
          fotos, vídeos e demais conteúdos enviados ao mural, telão ou cápsula.
        </li>
        <li>
          <strong>Pagamentos:</strong> identificadores de transação, plano contratado e histórico de faturas. Dados
          completos de cartão são processados pela Stripe e não são armazenados por nós.
        </li>
        <li>
          <strong>IA (quando ativada):</strong> textos e imagens enviados voluntariamente pelo responsável para geração
          ou edição de convites e materiais do evento.
        </li>
        <li>
          <strong>Técnicos:</strong> endereço IP, logs de acesso, cookies de sessão, identificadores de dispositivo e
          registros de segurança. Consulte também a <a href="/cookies">Política de Cookies</a>.
        </li>
      </ul>

      <h2>3. Finalidades</h2>
      <ul>
        <li>Criar e autenticar contas; operar convites, RSVP, mural ao vivo, telão e cápsula do tempo.</li>
        <li>Processar pagamentos, emitir comprovantes e manter histórico de contratações.</li>
        <li>Executar recursos de IA solicitados pelo responsável.</li>
        <li>Enviar comunicações transacionais (confirmações, avisos de evento, suporte).</li>
        <li>Prevenir fraude, abuso e incidentes de segurança; cumprir obrigações legais.</li>
        <li>Melhorar estabilidade e desempenho da plataforma, com dados agregados ou anonimizados quando possível.</li>
      </ul>

      <h2>4. Bases legais</h2>
      <p>Tratamos dados com fundamento em:</p>
      <ul>
        <li>
          <strong>Execução de contrato</strong> — prestação dos serviços contratados.
        </li>
        <li>
          <strong>Consentimento</strong> — RSVP, publicação de mídia no mural, cookies não essenciais e comunicações
          opcionais, quando aplicável.
        </li>
        <li>
          <strong>Legítimo interesse</strong> — segurança, prevenção a fraudes e melhoria técnica, respeitados seus
          direitos.
        </li>
        <li>
          <strong>Obrigação legal</strong> — retenção fiscal, resposta a autoridades e ordens judiciais.
        </li>
      </ul>

      <h2>5. Compartilhamento e operadores</h2>
      <p>Compartilhamos dados apenas quando necessário para operar o serviço, com operadores contratados sob cláusulas de proteção:</p>
      <ul>
        <li>
          <strong>Supabase</strong> — autenticação e banco de dados.
        </li>
        <li>
          <strong>Cloudflare (R2)</strong> — armazenamento de mídia.
        </li>
        <li>
          <strong>Stripe</strong> — processamento de pagamentos.
        </li>
        <li>
          <strong>OpenAI</strong> — recursos de IA quando ativados pelo responsável.
        </li>
        <li>
          <strong>Resend</strong> — envio de e-mails transacionais.
        </li>
        <li>
          <strong>Vercel</strong> — hospedagem da aplicação.
        </li>
      </ul>
      <p>
        Não vendemos dados pessoais. Convidados de um evento veem apenas o que o responsável autorizar (por exemplo,
        mural ou lista de presenças). Conteúdos da cápsula permanecem privados ao evento, salvo compartilhamento feito
        pelo responsável.
      </p>

      <h2>6. Transferência internacional</h2>
      <p>
        Alguns operadores podem processar dados fora do Brasil. Nesses casos, adotamos salvaguardas contratuais e
        técnicas compatíveis com a LGPD, limitando o tratamento ao necessário para a finalidade informada.
      </p>

      <h2>7. Retenção</h2>
      <p>
        Dados de eventos no plano gratuito são mantidos durante a vigência do evento. Cápsulas pagas seguem o período
        contratado (mínimo de 36 meses por evento, conforme plano). Após solicitação de exclusão ou término do prazo,
        removemos ou anonimizamos em prazo razoável, salvo obrigação legal ou necessidade de defesa de direitos. Detalhes
        em <a href="/armazenamento-capsula">Armazenamento e Cápsula</a>.
      </p>

      <h2>8. Seus direitos (LGPD)</h2>
      <p>Você pode solicitar, mediante comprovação de identidade:</p>
      <ul>
        <li>Confirmação da existência de tratamento e acesso aos dados.</li>
        <li>Correção de dados incompletos, inexatos ou desatualizados.</li>
        <li>Anonimização, bloqueio ou eliminação de dados desnecessários ou tratados em desconformidade.</li>
        <li>Portabilidade a outro fornecedor, quando aplicável.</li>
        <li>Informação sobre compartilhamentos e revogação de consentimento.</li>
        <li>Oposição a tratamentos baseados em legítimo interesse, quando cabível.</li>
      </ul>
      <p>
        Envie pedidos para{" "}
        <a href={`mailto:${LEGAL_CONTACT.privacy}`}>{LEGAL_CONTACT.privacy}</a>. Responderemos em até 15 dias úteis.
        Reclamações também podem ser dirigidas à Autoridade Nacional de Proteção de Dados (ANPD).
      </p>

      <h2>9. Crianças e adolescentes</h2>
      <p>
        Eventos familiares podem incluir nomes, fotos e dados de crianças. O responsável pelo evento deve obter
        consentimento dos pais ou responsáveis legais quando exigido e controlar quem acessa ou publica conteúdos com
        imagem de menores. A Praesentia não direciona serviços a crianças de forma autônoma; o cadastro exige maioridade
        civil para titularidade de conta.
      </p>

      <h2>10. Segurança</h2>
      <p>
        Adotamos medidas como criptografia em trânsito (HTTPS), controle de acesso, cookies httpOnly, segregação de
        ambientes, validação de uploads e monitoramento de incidentes. Nenhum sistema é totalmente isento de risco; em
        caso de incidente relevante, comunicaremos conforme exigido pela lei.
      </p>

      <h2>11. Alterações</h2>
      <p>
        Esta Política pode ser atualizada. A data no topo indica a versão vigente. Alterações relevantes serão
        comunicadas por e-mail ou aviso no painel.
      </p>

      <h2>12. Contato do controlador</h2>
      <p>
        Encarregado de privacidade e canal LGPD:{" "}
        <a href={`mailto:${LEGAL_CONTACT.privacy}`}>{LEGAL_CONTACT.privacy}</a>
      </p>
    </LegalPageShell>
  );
}
