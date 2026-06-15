import type { Metadata } from "next";
import { LegalControllerNotice } from "@/components/legal/legal-controller-notice";
import { LegalPageShell } from "@/components/legal/legal-page-shell";
import { LEGAL_CONTACT, LEGAL_UPDATED_AT } from "@/lib/legal/constants";

export const metadata: Metadata = {
  title: "Política de cookies — Praesentia",
  description: "Como a Praesentia utiliza cookies e tecnologias similares."
};

export default function CookiesPage() {
  return (
    <LegalPageShell title="Política de cookies" updatedAt={LEGAL_UPDATED_AT} currentPath="/cookies">
      <LegalControllerNotice />
      <p>
        Esta Política explica o uso de cookies e tecnologias similares na Praesentia. Complementa a{" "}
        <a href="/privacidade">Política de Privacidade</a>.
      </p>

      <h2>1. O que são cookies</h2>
      <p>
        Cookies são pequenos arquivos armazenados no seu navegador quando você visita um site. Servem para lembrar
        preferências, manter sessões autenticadas, medir desempenho e proteger contra abusos.
      </p>

      <h2>2. Cookies que utilizamos</h2>
      <ul>
        <li>
          <strong>Essenciais:</strong> necessários para login, segurança, carregamento de páginas e funcionamento do
          mural, telão e cápsula. Sem eles, partes do serviço não funcionam.
        </li>
        <li>
          <strong>Funcionais:</strong> lembram preferências de interface e configurações da sessão.
        </li>
        <li>
          <strong>Analíticos (quando ativos):</strong> ajudam a entender uso agregado da plataforma para melhorar
          desempenho e estabilidade, sem identificação direta para marketing de terceiros.
        </li>
      </ul>
      <p>
        Utilizamos cookies httpOnly na autenticação sempre que possível, reduzindo exposição a scripts maliciosos no
        navegador.
      </p>

      <h2>3. Tecnologias similares</h2>
      <p>
        Podemos usar armazenamento local (localStorage/sessionStorage) para preferências temporárias de interface e tokens
        de curta duração em fluxos específicos (por exemplo, acesso de convidado ao mural). Esses dados seguem as mesmas
        finalidades descritas nesta Política.
      </p>

      <h2>4. Cookies de terceiros</h2>
      <p>
        Ao realizar pagamento, a Stripe pode definir cookies próprios no fluxo de checkout. Processadores de
        infraestrutura (como Cloudflare) podem usar cookies técnicos de segurança e desempenho. Recomendamos consultar
        as políticas desses provedores quando aplicável.
      </p>

      <h2>5. Como gerenciar cookies</h2>
      <p>
        Você pode bloquear ou excluir cookies nas configurações do navegador. Cookies essenciais não podem ser
        desativados sem impacto no uso da plataforma. Instruções variam por navegador (Chrome, Safari, Firefox, Edge).
      </p>

      <h2>6. Alterações e contato</h2>
      <p>
        Podemos atualizar esta Política. Dúvidas:{" "}
        <a href={`mailto:${LEGAL_CONTACT.privacy}`}>{LEGAL_CONTACT.privacy}</a>
      </p>
    </LegalPageShell>
  );
}
