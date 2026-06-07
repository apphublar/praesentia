import Link from "next/link";
import { AppNav } from "@/components/layout/app-nav";
import { Confetti } from "@/components/visual/confetti";
import { createEventAction } from "@/app/criar/actions";

const messages = [
  ["ai", "Oi! Vamos criar seu evento. Me conta tipo, nome, data, local e tema."],
  ["me", "Aniversario de 1 ano da Mavie. 14 de marco de 2026, Quintal das Acacias em SP. Tema Jardim Encantado."],
  ["ai", "Perfeito. Sugeri uma paleta de jardim suave, texto do convite, capa e mensagem pos-evento."],
  ["me", "Pode deixar mais infantil e com cara de natureza?"],
  ["ai", "Gerei 3 direcoes de capa e preparei o preview ao vivo."]
];

export default function CreatePage() {
  return (
    <>
      <AppNav />
      <main className="paper" style={{ minHeight: "calc(100vh - 64px)" }}>
        <div className="grid-collapse create-layout" style={{ display: "grid", gridTemplateColumns: "minmax(0,520px) minmax(0,1fr)", minHeight: "calc(100vh - 64px)" }}>
          <section className="create-chat-panel" style={{ borderRight: "1px solid var(--line)", padding: "24px 28px", display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ width: 42, height: 42, borderRadius: 12, background: "var(--ink)", color: "var(--gold)", display: "grid", placeItems: "center", fontWeight: 900 }}>IA</span>
              <div>
                <h1 className="display" style={{ margin: 0, fontSize: 22 }}>Vamos criar seu convite</h1>
                <div style={{ color: "var(--ink-soft)", fontSize: 12 }}>passo 4 de 6 - rascunho salvo</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              {[1, 2, 3, 4, 5, 6].map((step) => (
                <span key={step} style={{ flex: 1, height: 5, borderRadius: 999, background: step <= 4 ? "var(--coral)" : "var(--bg-soft)" }} />
              ))}
            </div>
            <form action={createEventAction} className="card create-real-form">
              <div>
                <div className="mono" style={{ color: "var(--ink-soft)", fontSize: 10, fontWeight: 800, textTransform: "uppercase" }}>dados reais do evento</div>
                <h2 className="display" style={{ fontSize: 24, margin: "8px 0 0" }}>Publicar primeiro rascunho</h2>
              </div>
              <label>
                <span>Nome do evento</span>
                <input name="title" defaultValue="Mavie - 1 ano" required maxLength={120} />
              </label>
              <label>
                <span>Tema</span>
                <input name="theme" defaultValue="Jardim Encantado" required maxLength={120} />
              </label>
              <div className="create-form-grid">
                <label>
                  <span>Data</span>
                  <input name="date" type="date" defaultValue="2026-03-14" required />
                </label>
                <label>
                  <span>Início</span>
                  <input name="startsAt" type="time" defaultValue="15:00" required />
                </label>
                <label>
                  <span>Fim</span>
                  <input name="endsAt" type="time" defaultValue="19:00" required />
                </label>
              </div>
              <label>
                <span>Local</span>
                <input name="venueName" defaultValue="Quintal das Acácias" required maxLength={160} />
              </label>
              <label>
                <span>Endereço</span>
                <input name="venueAddress" defaultValue="R. das Hortênsias, 88 - Jardim Botânico" required maxLength={220} />
              </label>
              <label>
                <span>Cidade</span>
                <input name="city" defaultValue="São Paulo" required maxLength={120} />
              </label>
              <button className="btn" type="submit">Criar evento e abrir painel</button>
              <p>O evento nasce privado. Depois você pode configurar Pix, convidados, telão e plano.</p>
            </form>
            <div style={{ flex: 1, overflow: "auto", display: "grid", gap: 12, alignContent: "start" }}>
              {messages.map(([side, text], index) => (
                <div key={index} style={{ display: "flex", justifyContent: side === "me" ? "flex-end" : "flex-start" }}>
                  <div
                    style={{
                      maxWidth: "84%",
                      background: side === "me" ? "var(--ink)" : "var(--card)",
                      color: side === "me" ? "var(--bg)" : "var(--ink)",
                      border: side === "me" ? 0 : "1px solid var(--line)",
                      borderRadius: side === "me" ? "16px 16px 4px 16px" : "4px 16px 16px 16px",
                      padding: "11px 14px",
                      lineHeight: 1.45,
                      fontSize: 14
                    }}
                  >
                    {text}
                  </div>
                </div>
              ))}
              <div className="card" style={{ padding: 14 }}>
                <div className="display-i" style={{ fontSize: 21 }}>A Mavie vai fazer 1 aninho!</div>
                <p style={{ color: "var(--ink-soft)", lineHeight: 1.5, fontSize: 13 }}>
                  Sob a sombra das acacias, no quintal favorito da família, vamos celebrar o primeiro giro em volta do sol.
                </p>
                <div style={{ display: "flex", gap: 8 }}>
                  <span className="pill" style={{ background: "var(--green)", color: "#fff" }}>usar</span>
                  <span className="pill">refazer</span>
                  <span className="pill">mais curto</span>
                </div>
              </div>
              <div className="card" style={{ padding: 14 }}>
                <div className="mono" style={{ color: "var(--ink-soft)", fontSize: 10, fontWeight: 800, textTransform: "uppercase" }}>paleta - jardim suave</div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10 }}>
                  {["var(--coral)", "var(--gold)", "var(--green)", "var(--sky)", "var(--violet)"].map((color) => (
                    <span key={color} style={{ width: 30, height: 30, borderRadius: 999, background: color, border: "2px solid var(--card)", boxShadow: "0 0 0 1px var(--line)" }} />
                  ))}
                  <button className="btn secondary" style={{ marginLeft: "auto", padding: "8px 10px", borderRadius: 999 }}>trocar</button>
                </div>
              </div>
              <div className="card" style={{ padding: 14 }}>
                <div className="mono" style={{ color: "var(--ink-soft)", fontSize: 10, fontWeight: 800, textTransform: "uppercase" }}>capas geradas</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginTop: 10 }}>
                  {[
                    ["aquarela", "#f4d5ba"],
                    ["botanico", "#d7edd9"],
                    ["pop infantil", "#e5d5f2"]
                  ].map(([label, color], index) => (
                    <div key={label} style={{ aspectRatio: "3/4", borderRadius: 10, border: index === 1 ? "2.5px solid var(--coral)" : "1px solid var(--line)", overflow: "hidden", position: "relative" }}>
                      <div className="placeholder" style={{ width: "100%", height: "100%", backgroundColor: color }}>{label}</div>
                      {index === 1 && <span style={{ position: "absolute", right: 6, top: 6, width: 18, height: 18, borderRadius: 999, background: "var(--coral)", color: "#fff", display: "grid", placeItems: "center", fontSize: 11 }}>✓</span>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="card create-input-bar" style={{ padding: 12, display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ color: "var(--ink-soft)", flex: 1 }}>peca uma mudanca, refine o tom, anexe foto...</span>
              <button className="btn" style={{ boxShadow: "none" }}>Enviar</button>
            </div>
          </section>

          <section className="create-preview-panel" style={{ padding: "34px 5vw", overflow: "auto" }}>
            <div className="create-preview-toolbar" style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span className="pill">preview ao vivo</span>
              <span className="pill">desktop - mobile</span>
              <span className="pill">rascunho salvo</span>
              <Link className="btn secondary" href="/evento/mavie-1-ano" style={{ marginLeft: "auto" }}>Publicar demo</Link>
            </div>
            <div style={{ display: "grid", placeItems: "center", marginTop: 28 }}>
              <div className="card create-phone-preview" style={{ width: 340, minHeight: 640, borderRadius: 32, padding: 20, boxShadow: "10px 12px 0 rgba(27,18,9,.10)", position: "relative" }}>
                <div style={{ width: 82, height: 22, borderRadius: 999, background: "var(--ink)", margin: "0 auto 18px" }} />
                <div style={{ textAlign: "center", position: "relative" }}>
                  <Confetti />
                  <div className="mono" style={{ color: "var(--ink-soft)", fontSize: 10, fontWeight: 800, textTransform: "uppercase" }}>tema - jardim encantado</div>
                  <h2 className="display-i" style={{ fontSize: 72, lineHeight: .86, margin: "4px 0 0" }}>Mavie</h2>
                  <div className="display" style={{ color: "var(--coral)", fontSize: 23 }}>1 aninho</div>
                </div>
                <div className="polaroid" style={{ marginTop: 18, transform: "rotate(-3deg)" }}>
                  <div className="placeholder" style={{ height: 170, backgroundColor: "#d7edd9" }}>botanico</div>
                </div>
                <div style={{ marginTop: 18 }}>
                  <div className="mono" style={{ color: "var(--ink-soft)", fontSize: 10, fontWeight: 800, textTransform: "uppercase" }}>quando - onde</div>
                  <div className="display" style={{ fontSize: 18 }}>14 mar 2026 - 15h</div>
                  <p style={{ color: "var(--ink-soft)", marginTop: 4 }}>Quintal das Acacias - SP</p>
                </div>
                <button className="btn" style={{ width: "100%", marginTop: 20 }}>Confirmar presença</button>
              </div>
            </div>
            <div className="grid-collapse-3 create-summary-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginTop: 22 }}>
              {[
                ["Texto", "Convite, WhatsApp e pos-evento prontos para editar."],
                ["Privacidade", "Evento privado por padrão, com convidados e senha do responsável."],
                ["Cápsula", "Depois do evento, o mesmo link vira memória por 36 meses."]
              ].map(([title, text]) => (
                <article key={title} className="card" style={{ padding: 14 }}>
                  <h3 className="display" style={{ fontSize: 21, margin: 0 }}>{title}</h3>
                  <p style={{ color: "var(--ink-soft)", lineHeight: 1.5, fontSize: 13 }}>{text}</p>
                </article>
              ))}
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
