import type { Metadata } from "next";
import { LegalPageShell } from "@/components/legal/legal-page-shell";

export const metadata: Metadata = {
  title: "Termos de uso — Praesentia",
  description: "Termos de uso da plataforma Praesentia para eventos particulares e cápsulas digitais."
};

export default function TermsPage() {
  return (
    <LegalPageShell title="Termos de uso" updatedAt="9 de junho de 2026">
      <p>
        Estes Termos regem o uso da Praesentia por responsáveis de eventos, convidados e visitantes. Ao criar uma conta,
        organizar um evento ou confirmar presença, você concorda com estas condições.
      </p>

      <h2>1. O serviço</h2>
      <p>
        A Praesentia oferece ferramentas para convites digitais, confirmação de presença, mural ao vivo, telão e cápsulas
        do tempo privadas. Funcionalidades variam conforme o plano contratado.
      </p>

      <h2>2. Conta e responsabilidade</h2>
      <p>
        O responsável pelo evento é titular dos dados do evento, define convidados, modera conteúdos e decide o que
        permanece na cápsula. Convidados só publicam após RSVP confirmado, conforme as regras de cada evento.
      </p>

      <h2>3. Conteúdos</h2>
      <p>
        Fotos, vídeos e recados enviados devem respeitar direitos de imagem e a privacidade dos participantes,
        especialmente de crianças. A Praesentia pode remover conteúdos que violem a lei ou estes Termos, mediante
        solicitação do responsável ou ordem legal.
      </p>

      <h2>4. Planos e pagamentos</h2>
      <p>
        Planos gratuitos e pagos estão descritos no site. Pagamentos são processados pela Stripe. Reembolsos seguem a
        política informada no momento da compra e a legislação aplicável ao consumidor.
      </p>

      <h2>5. Disponibilidade e armazenamento</h2>
      <p>
        Cápsulas pagas têm período mínimo de guarda informado no plano. Eventos gratuitos permanecem ativos durante o
        evento. A Praesentia emprega boas práticas de backup, sem garantia de disponibilidade ininterrupta.
      </p>

      <h2>6. Limitação de responsabilidade</h2>
      <p>
        A Praesentia não se responsabiliza por perdas indiretas, interrupções causadas por terceiros ou uso indevido da
        plataforma pelos usuários. A responsabilidade total limita-se ao valor pago pelo serviço nos últimos 12 meses,
        quando aplicável.
      </p>

      <h2>7. Alterações</h2>
      <p>
        Podemos atualizar estes Termos. Mudanças relevantes serão comunicadas por e-mail ou aviso no painel. O uso
        continuado após a vigência constitui aceite.
      </p>

      <h2>8. Contato</h2>
      <p>
        Dúvidas sobre estes Termos: <a href="mailto:contato@praesentia.com.br">contato@praesentia.com.br</a>
      </p>
    </LegalPageShell>
  );
}
