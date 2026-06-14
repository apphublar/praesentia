import type { Metadata } from "next";
import { LegalPageShell } from "@/components/legal/legal-page-shell";

export const metadata: Metadata = {
  title: "Política de privacidade — Praesentia",
  description: "Como a Praesentia trata dados pessoais em eventos particulares e cápsulas digitais."
};

export default function PrivacyPage() {
  return (
    <LegalPageShell title="Política de privacidade" updatedAt="9 de junho de 2026">
      <p>
        A Praesentia trata dados pessoais conforme a Lei Geral de Proteção de Dados (LGPD — Lei 13.709/2018). Esta
        política explica o que coletamos, por quê e quais são seus direitos.
      </p>

      <h2>1. Quem somos</h2>
      <p>
        A Praesentia é uma plataforma brasileira de eventos particulares e cápsulas digitais. Para exercer seus
        direitos: <a href="mailto:privacidade@praesentia.com.br">privacidade@praesentia.com.br</a>
      </p>

      <h2>2. Dados que coletamos</h2>
      <ul>
        <li>Conta: nome, e-mail, credenciais de acesso</li>
        <li>Evento: título, data, local, convidados, RSVPs, mensagens e mídia enviada</li>
        <li>Pagamentos: processados pela Stripe; não armazenamos número completo de cartão</li>
        <li>Técnicos: logs, IP, cookies de sessão para segurança e funcionamento</li>
      </ul>

      <h2>3. Finalidades</h2>
      <ul>
        <li>Operar convites, RSVP, mural, telão e cápsula</li>
        <li>Processar pagamentos e histórico de faturas</li>
        <li>Gerar convites com IA quando solicitado pelo responsável</li>
        <li>Prevenir abuso, fraude e garantir segurança</li>
        <li>Cumprir obrigações legais</li>
      </ul>

      <h2>4. Bases legais</h2>
      <p>
        Execução de contrato (uso da plataforma), consentimento (RSVP, publicação de mídia, marketing opcional),
        legítimo interesse (segurança e melhoria do serviço) e obrigação legal quando aplicável.
      </p>

      <h2>5. Compartilhamento</h2>
      <p>
        Utilizamos processadores: Supabase (auth/banco), Cloudflare (armazenamento), Stripe (pagamentos), OpenAI
        (geração de convites quando ativada), Resend (e-mails). Não vendemos dados pessoais.
      </p>

      <h2>6. Retenção</h2>
      <p>
        Dados de eventos gratuitos são mantidos durante o evento. Cápsulas pagas seguem o período contratado (mínimo
        informado no plano). Após exclusão solicitada, removemos ou anonimizamos em prazo razoável, salvo obrigação legal.
      </p>

      <h2>7. Seus direitos (LGPD)</h2>
      <p>Você pode solicitar:</p>
      <ul>
        <li>Confirmação e acesso aos dados</li>
        <li>Correção de dados incompletos ou desatualizados</li>
        <li>Anonimização, bloqueio ou eliminação de dados desnecessários</li>
        <li>Portabilidade, quando aplicável</li>
        <li>Revogação de consentimento</li>
      </ul>
      <p>
        Envie pedidos para <a href="mailto:privacidade@praesentia.com.br">privacidade@praesentia.com.br</a>. Responderemos
        em até 15 dias úteis.
      </p>

      <h2>8. Crianças e adolescentes</h2>
      <p>
        Eventos familiares podem incluir dados de crianças sob responsabilidade dos pais ou organizadores. Publicação de
        imagens de menores depende do controle do responsável pelo evento e do consentimento aplicável.
      </p>

      <h2>9. Segurança</h2>
      <p>
        Empregamos criptografia em trânsito (HTTPS), controle de acesso, cookies httpOnly e práticas de segurança em
        uploads e APIs.
      </p>

      <h2>10. Alterações</h2>
      <p>
        Esta política pode ser atualizada. A data no topo indica a versão vigente. Alterações relevantes serão
        comunicadas aos usuários cadastrados.
      </p>
    </LegalPageShell>
  );
}
