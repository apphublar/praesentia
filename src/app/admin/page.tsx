import { AppNav } from "@/components/layout/app-nav";
import { getCurrentSession, isPlatformAdmin } from "@/lib/auth/session";

const productionControls = [
  "Supabase Auth com MFA para administradores.",
  "Postgres com migrations, backup e Row Level Security onde fizer sentido.",
  "Cloudflare R2 privado com URLs assinadas e delecao fisica de objetos.",
  "Stripe com webhooks assinados e reconciliacao de planos.",
  "Resend com dominio verificado e templates transacionais.",
  "Cloudflare WAF, rate limit e Turnstile nos pontos criticos.",
  "Observabilidade com erros, logs e alertas de incidentes.",
  "Processo LGPD para consentimento, exportacao e exclusao de dados."
];

export default async function AdminPage() {
  const session = await getCurrentSession();
  const allowed = session && isPlatformAdmin(session.user);

  return (
    <>
      <AppNav />
      <main className="shell" style={{ padding: "38px 0 80px" }}>
        <span className="pill">admin da plataforma</span>
        <h1 style={{ fontSize: 52, margin: "14px 0" }}>Operacao Praesentia</h1>
        {!allowed && (
          <section className="card" style={{ padding: 22, marginBottom: 24, borderColor: "var(--coral)" }}>
            <h2 style={{ marginTop: 0 }}>Acesso restrito</h2>
            <p style={{ color: "var(--ink-soft)", lineHeight: 1.55 }}>
              Esta area exige perfil de administrador da plataforma e autenticacao forte.
            </p>
          </section>
        )}
        {allowed && (
          <>
            <section className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
              {[
                ["Dono do projeto", "Opera planos, dominios, armazenamento Cloudflare, auditoria, seguranca e suporte."],
                ["Responsavel pelo evento", "Cria convite, informa Pix, gerencia convidados, telao, conteudos e bloqueios."],
                ["Convidado confirmado", "Com conta criada, pode enviar fotos, videos, recados e curtir de forma confidencial."],
                ["Visitante", "So acessa o que o responsavel permitir. Eventos nascem privados por padrao."]
              ].map(([title, text]) => (
                <article key={title} className="card" style={{ padding: 20 }}>
                  <h2 className="display" style={{ fontSize: 25, margin: 0 }}>{title}</h2>
                  <p style={{ color: "var(--ink-soft)", lineHeight: 1.6 }}>{text}</p>
                </article>
              ))}
            </section>

            <section className="card" style={{ padding: 22, marginTop: 24 }}>
              <h2 style={{ marginTop: 0 }}>Controles obrigatorios antes da producao</h2>
              <ul style={{ color: "var(--ink-soft)", lineHeight: 1.9 }}>
                {productionControls.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </section>

            <section className="card" style={{ padding: 22, marginTop: 24, background: "var(--ink)", color: "var(--bg)" }}>
              <h2 className="display" style={{ marginTop: 0, fontSize: 30 }}>Painel operacional real</h2>
              <p style={{ color: "rgba(247,238,219,.72)", lineHeight: 1.65 }}>
                Metricas globais, auditoria, suporte e busca de usuarios devem vir de repositorios administrativos reais antes do uso em producao.
              </p>
            </section>
          </>
        )}
      </main>
    </>
  );
}
