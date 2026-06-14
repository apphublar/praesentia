import Link from "next/link";
import { AppNav } from "@/components/layout/app-nav";
import { Avatar } from "@/components/visual/avatar";
import { marketingImages } from "@/lib/marketing/marketing-images";

const years = [
  {
    year: "2026",
    events: [
      ["14 mar", "Mavie Fontinhas - 1 aninho", "convidada", "247 fotos - 86 recados", marketingImages.featured.mavie],
      ["01 jan", "Reveillon na cobertura", "convidada", "94 fotos - 12 vídeos", marketingImages.featured.reveillon]
    ]
  },
  {
    year: "2025",
    events: [
      ["22 nov", "Casamento João & Ana", "convidada", "412 fotos - 38 vídeos", marketingImages.featured.wedding],
      ["03 jun", "Aniversário da Lila - 30", "criadora", "92 fotos - 14 vídeos", marketingImages.featured.reveillon]
    ]
  },
  {
    year: "2024",
    events: [
      ["14 dez", "Chá da Mavie Fontinhas", "convidada", "88 fotos - 4 vídeos", marketingImages.timeline.cha],
      ["20 set", "Aniversário da vovó - 70", "criadora", "156 fotos - 18 vídeos", marketingImages.timeline.favorite]
    ]
  }
];

const mavieTimeline = [
  ["2025", "chá da Mavie Fontinhas", marketingImages.timeline.cha],
  ["2026", "1 aninho", marketingImages.timeline.mavie1],
  ["2028", "3 anos", marketingImages.timeline.years3],
  ["2030", "5 anos", marketingImages.timeline.years5],
  ["2032", "7 anos", marketingImages.timeline.years7],
  ["2043", "18 anos", null]
] as const;

export default function ProfilePage() {
  return (
    <>
      <AppNav />
      <main className="shell paper" style={{ padding: "44px 0 90px" }}>
        <section className="card" style={{ padding: 24, background: "var(--ink)", color: "var(--bg)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap" }}>
            <Avatar name="Maria Silva" tint="var(--coral)" size={72} />
            <div>
              <span className="pill" style={{ background: "rgba(247,238,219,.08)", color: "var(--gold)" }}>meu perfil</span>
              <h1 className="display-i" style={{ fontSize: "clamp(42px,6vw,78px)", lineHeight: .92, margin: "10px 0 4px" }}>Maria Silva</h1>
              <p style={{ color: "rgba(247,238,219,.72)", margin: 0 }}>Dinda da Mavie Fontinhas, mae do Caio. Presente em 14 eventos.</p>
            </div>
            <Link className="btn" href="/evento/mavie-1-ano" style={{ marginLeft: "auto", background: "var(--gold)", color: "var(--ink)", boxShadow: "4px 5px 0 var(--coral)" }}>
              Abrir lembranca
            </Link>
          </div>
        </section>

        <section className="grid-collapse" style={{ display: "grid", gridTemplateColumns: "1.2fr .8fr", gap: 18, marginTop: 24 }}>
          <article className="card" style={{ padding: 24 }}>
            <span className="pill">presença conectada</span>
            <h2 className="display-i" style={{ fontSize: "clamp(34px,4vw,54px)", lineHeight: 1, margin: "12px 0" }}>
              Um perfil para lembrar onde você esteve.
            </h2>
            <p style={{ color: "var(--ink-soft)", lineHeight: 1.65 }}>
              Cada evento particular confirmado pode virar um ponto da sua história: festas criadas, cápsulas em que você apareceu, fotos enviadas, recados deixados e memórias que você ajudou a preservar.
            </p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <span className="pill" style={{ background: "var(--coral)", color: "#fff" }}>convidada</span>
              <span className="pill" style={{ background: "var(--gold)", color: "var(--ink)" }}>responsável</span>
              <span className="pill" style={{ background: "var(--violet)", color: "#fff" }}>família</span>
            </div>
          </article>
          <article className="card" style={{ padding: 24, background: "var(--bg-soft)" }}>
            <div className="mono" style={{ color: "var(--ink-soft)", fontSize: 11, fontWeight: 800, textTransform: "uppercase" }}>privacidade do perfil</div>
            <h3 className="display" style={{ fontSize: 28, margin: "10px 0" }}>Nada aparece sem permissão.</h3>
            <p style={{ color: "var(--ink-soft)", lineHeight: 1.6 }}>
              Eventos privados continuam privados. O perfil mostra somente o que a pessoa pode acessar e o que cada responsável permitiu manter na cápsula.
            </p>
          </article>
        </section>

        <section className="grid-collapse-3" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginTop: 24 }}>
          {[
            ["14", "eventos participados", "var(--coral)"],
            ["47", "memórias compartilhadas", "var(--gold)"],
            ["3", "eventos criados", "var(--violet)"]
          ].map(([number, label, color]) => (
            <article key={label} className="card" style={{ padding: 20 }}>
              <div className="display" style={{ fontSize: 56, lineHeight: 1, color }}>{number}</div>
              <div className="mono" style={{ color: "var(--ink-soft)", fontSize: 11, fontWeight: 800, textTransform: "uppercase" }}>{label}</div>
            </article>
          ))}
        </section>

        <section style={{ marginTop: 34 }}>
          <span className="pill">vida em cápsulas</span>
          <h2 className="display-i" style={{ fontSize: "clamp(36px,5vw,68px)", lineHeight: .95, margin: "12px 0 24px" }}>
            Tudo que você ajudou a guardar.
          </h2>
          {years.map((group) => (
            <div key={group.year} style={{ marginTop: 26 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <h3 className="display-i" style={{ fontSize: 64, color: group.year === "2026" ? "var(--coral)" : "var(--ink-soft)", margin: 0 }}>{group.year}</h3>
                <span style={{ flex: 1, height: 1, background: "var(--line)" }} />
              </div>
              <div className="grid-collapse-4" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
                {group.events.map(([date, title, role, stat, image]) => (
                  <Link
                    key={title}
                    href={title.includes("Mavie Fontinhas") ? "/evento/mavie-1-ano" : "/eu"}
                    className="polaroid"
                    style={{ transform: "rotate(-1deg)", color: "var(--ink)" }}
                  >
                    <div className="marketing-photo" style={{ height: 150 }}>
                      <img src={image} alt={title} loading="lazy" decoding="async" />
                    </div>
                    <div className="display-i" style={{ fontSize: 18, marginTop: 8 }}>{title}</div>
                    <div style={{ color: "var(--ink-soft)", fontSize: 12 }}>{date} · {role} · {stat}</div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </section>

        <section className="card" style={{ marginTop: 44, padding: 0, background: "var(--ink)", color: "var(--bg)", overflow: "hidden" }}>
          <div style={{ padding: "26px 28px 12px", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
            <Avatar name="Mavie Fontinhas" tint="var(--coral)" size={44} />
            <div>
              <h2 className="display-i" style={{ margin: 0, fontSize: 34 }}>Quando a Mavie Fontinhas tiver 18.</h2>
              <p style={{ color: "rgba(247,238,219,.72)", margin: "4px 0 0" }}>A família poderá entregar uma linha do tempo de presenças reais.</p>
            </div>
            <span className="pill" style={{ marginLeft: "auto", background: "var(--gold)", color: "var(--ink)" }}>privado da família</span>
          </div>
          <p className="life-demo-banner life-demo-banner-dark">Exemplo fictício — perfil, eventos e números são apenas demonstração.</p>
          <div style={{ display: "flex", gap: 16, overflowX: "auto", padding: "18px 28px 28px" }}>
            {mavieTimeline.map(([year, label, image], index) => (
              <div key={year} style={{ minWidth: 170, textAlign: "center" }}>
                <div className="polaroid" style={{ background: image ? "#fff" : "rgba(247,238,219,.05)", border: image ? "none" : "1.5px dashed rgba(247,238,219,.35)" }}>
                  {image ? (
                    <div className="marketing-photo" style={{ height: 100 }}>
                      <img src={image} alt={label} loading="lazy" decoding="async" />
                    </div>
                  ) : (
                    <div className="placeholder" style={{ height: 100, backgroundColor: "transparent", color: "rgba(247,238,219,.55)" }}>
                      aguardando
                    </div>
                  )}
                </div>
                <div className="display" style={{ color: index === 1 ? "var(--coral)" : "var(--gold)", fontSize: 28, marginTop: 8 }}>{year}</div>
                <p style={{ color: "rgba(247,238,219,.72)", fontSize: 12, lineHeight: 1.4 }}>{label}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="card" style={{ marginTop: 24, padding: 24 }}>
          <h2 className="display-i" style={{ marginTop: 0, fontSize: 34 }}>Seus eventos nunca serão apagados sem aviso.</h2>
          <p style={{ color: "var(--ink-soft)", lineHeight: 1.65 }}>
            Cada cápsula que você ajudou a construir continua acessível pelo link original enquanto houver permissão do responsável. Você pode exportar seus dados quando o produto tiver a rotina de exportação habilitada.
          </p>
        </section>
      </main>
    </>
  );
}
