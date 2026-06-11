import Link from "next/link";
import { AppNav } from "@/components/layout/app-nav";
import {
  FAQSection,
  FeaturedCapsulesSection,
  FinalCTASection,
  LifeCapsulesSection,
  PricingSection,
  PrintedAlbumSection,
  PrivacySection,
  SiteFooter,
  StorageSection,
  TransformationSection
} from "@/components/marketing/extra-sections";
import { AvatarStack } from "@/components/visual/avatar";
import { Confetti } from "@/components/visual/confetti";

const phases = [
  {
    phase: "antes",
    title: "Convite",
    text: "Convite digital privado com IA, RSVP, contagem regressiva, lista de convidados e Pix opcional.",
    color: "var(--coral)"
  },
  {
    phase: "durante",
    title: "Mural ao vivo",
    text: "Convidados confirmados compartilham fotos, vídeos e recados. O telão atualiza sem refresh.",
    color: "var(--gold)"
  },
  {
    phase: "depois",
    title: "Cápsula do tempo",
    text: "O mesmo link vira memória permanente por 36 meses, com exportação e controle do responsável.",
    color: "var(--violet)"
  }
];

const pillars = [
  ["01", "A IA cria o convite", "1 imagem com IA grátis, texto e assistente de prompt. Precisa de mais versões? Pacote simbólico de R$ 4,90."],
  ["02", "Convidados confirmam", "Cada pessoa confirma presença e cria conta para participar da cápsula com segurança."],
  ["03", "O evento fica vivo", "Fotos, vídeos, recados e curtidas confidenciais aparecem no mural e no telão em tempo real."],
  ["04", "Tudo vira memória", "Depois da festa, a cápsula guarda o que foi vivido com permissão, acesso e armazenamento controlados."]
];

export default function HomePage() {
  return (
    <>
      <AppNav />
      <main className="paper">
        <section
          className="shell grid-collapse"
          style={{
            padding: "54px 0 36px",
            display: "grid",
            gridTemplateColumns: "minmax(0, 1.05fr) minmax(0, .95fr)",
            gap: 40,
            alignItems: "center"
          }}
        >
          <div style={{ position: "relative" }}>
            <Confetti style={{ position: "absolute", left: -26, top: -24 }} />
            <span className="pill">
              <span style={{ width: 6, height: 6, borderRadius: 999, background: "var(--coral)" }} />
              beta - eventos privados
            </span>
            <h1 className="display-i" style={{ margin: "18px 0 0", fontSize: "clamp(50px, 8vw, 112px)", lineHeight: 0.94 }}>
              Todo momento
              <br />
              começa com
              <br />
              <span style={{ color: "var(--coral)" }}>
                uma <span className="hand-underline">presença</span>.
              </span>
            </h1>
            <p style={{ color: "var(--ink-soft)", fontSize: "clamp(16px, 1.4vw, 19px)", lineHeight: 1.6, maxWidth: 580 }}>
              Praesentia transforma festas particulares em cápsulas do tempo digitais. Crie o convite, confirme
              presenças, receba contribuições Pix opcionais, mostre memórias no telão e guarde tudo por 36 meses.
            </p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 26 }}>
              <Link className="btn" href="/criar">
                Criar meu evento
              </Link>
              <Link className="btn secondary" href="/evento/mavie-1-ano">
                Ver exemplo
              </Link>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 26 }}>
              <AvatarStack
                people={[
                  { name: "Ana B", tint: "#ff6b5c" },
                  { name: "Pedro L", tint: "#6ab7e8" },
                  { name: "Lu M", tint: "#ffb23e" },
                  { name: "Caio R", tint: "#6fbf73" },
                  { name: "Lila", tint: "#b69ae8" }
                ]}
              />
              <span style={{ color: "var(--ink-soft)", fontSize: 13 }}>
                <strong style={{ color: "var(--ink)" }}>12.487 famílias</strong> já guardam memórias aqui
              </span>
            </div>
          </div>

          <div style={{ position: "relative", minHeight: 500 }}>
            <div className="polaroid float" style={{ position: "absolute", top: 8, left: "8%", width: 230, transform: "rotate(-7deg)" }}>
              <div className="placeholder" style={{ height: 230, backgroundColor: "var(--bg-soft)" }}>
                ensaio - mavie
              </div>
              <div className="display-i" style={{ fontSize: 14, textAlign: "center", marginTop: 8 }}>
                1 ano da Mavie
              </div>
            </div>
            <div
              className="polaroid float"
              style={{ position: "absolute", top: 62, right: "4%", width: 250, zIndex: 2, transform: "rotate(6deg)", animationDelay: ".4s" }}
            >
              <div className="placeholder" style={{ height: 260, backgroundColor: "#f1d8c9" }}>
                bolo - 17h12
              </div>
              <div className="display-i" style={{ fontSize: 14, textAlign: "center", marginTop: 8 }}>
                parabéns da vovó
              </div>
            </div>
            <div
              className="polaroid float"
              style={{ position: "absolute", bottom: 26, left: "20%", width: 210, transform: "rotate(-3deg)", animationDelay: ".9s" }}
            >
              <div className="placeholder" style={{ height: 170, backgroundColor: "#d9e8f4" }}>
                vídeo - 02:14
              </div>
              <div className="display-i" style={{ fontSize: 14, textAlign: "center", marginTop: 8 }}>
                primeiros passos
              </div>
            </div>
            <span className="tape" style={{ top: 4, left: "32%", transform: "rotate(-4deg)" }} />
            <span className="tape" style={{ top: 44, right: "32%", transform: "rotate(7deg)", background: "rgba(255,107,92,.7)" }} />
          </div>
        </section>

        <section className="shell" style={{ padding: "36px 0" }}>
          <div style={{ background: "var(--ink)", color: "var(--bg)", borderRadius: 22, padding: "34px 36px", position: "relative", overflow: "hidden" }}>
            <div className="mono" style={{ color: "var(--gold)", fontSize: 12, fontWeight: 800, textTransform: "uppercase" }}>
              O mesmo link — três vidas
            </div>
            <h2 className="display-i" style={{ fontSize: "clamp(34px, 4vw, 58px)", lineHeight: 1, margin: "8px 0 24px" }}>
              Um endereço que não <span style={{ color: "var(--coral)" }}>expira</span>.
            </h2>
            <div className="grid-collapse-3" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
              {phases.map((item) => (
                <article key={item.phase} style={{ background: "rgba(247,238,219,.07)", border: "1px solid rgba(247,238,219,.18)", borderRadius: 16, padding: 22 }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <span style={{ width: 8, height: 8, borderRadius: 999, background: item.color }} />
                    <span className="mono" style={{ color: item.color, fontSize: 11, fontWeight: 800, textTransform: "uppercase" }}>
                      fase - {item.phase}
                    </span>
                  </div>
                  <h3 className="display-i" style={{ fontSize: 32, margin: "10px 0 8px" }}>
                    {item.title}
                  </h3>
                  <p style={{ color: "rgba(247,238,219,.78)", lineHeight: 1.55, margin: 0 }}>{item.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="como-funciona" className="shell" style={{ padding: "42px 0" }}>
          <span className="pill">como funciona</span>
          <h2 className="display-i" style={{ fontSize: "clamp(34px, 4vw, 58px)", margin: "10px 0 26px", lineHeight: 1 }}>
            Quatro passos. <span style={{ color: "var(--coral)" }}>Uma cápsula.</span>
          </h2>
          <div className="grid-collapse-4" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
            {pillars.map(([number, title, text], index) => (
              <article key={number} className="card" style={{ padding: "20px 22px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 10,
                      background: ["var(--coral)", "var(--sky)", "var(--gold)", "var(--violet)"][index],
                      color: "#fff",
                      display: "grid",
                      placeItems: "center",
                      fontWeight: 900
                    }}
                  >
                    {number}
                  </span>
                </div>
                <h3 className="display" style={{ fontSize: 23, lineHeight: 1.1 }}>{title}</h3>
                <p style={{ color: "var(--ink-soft)", lineHeight: 1.55 }}>{text}</p>
              </article>
            ))}
          </div>
        </section>

        <StorageSection />
        <TransformationSection />
        <FeaturedCapsulesSection />
        <LifeCapsulesSection />
        <PrivacySection />
        <PrintedAlbumSection />
        <PricingSection />
        <FinalCTASection />
        <FAQSection />
        <SiteFooter />
      </main>
    </>
  );
}
