import { GuestPolaroidFrame } from "@/components/media/guest-polaroid-frame";
import { marketingImages } from "@/lib/marketing/marketing-images";

const muralSamples = [
  { src: marketingImages.featured.mavie, alt: "Mavie Fontinhas com o bolo de aniversário", author: "Ana B." },
  { src: marketingImages.timeline.favorite, alt: "Abraço na festa da Mavie Fontinhas", author: "Vovó Lila" },
  { src: marketingImages.timeline.years3, alt: "Mavie Fontinhas brincando no jardim", author: "Pedro L." }
] as const;

const capsuleSamples = [
  { src: marketingImages.featured.mavie, alt: "Mavie Fontinhas — 1 aninho", caption: "bolo · 17h12", rotate: -2.5, tape: "var(--tape-y)" },
  { src: marketingImages.timeline.favorite, alt: "Abraço da família", caption: "com a vovó", rotate: 2, tape: "var(--tape-c)" },
  { src: marketingImages.timeline.years5, alt: "Soprando as velas", caption: "parabéns!", rotate: -1.5, tape: "var(--tape-y)" },
  { src: marketingImages.timeline.years7, alt: "Família reunida na festa", caption: "7 anos", rotate: 1.5, tape: "var(--tape-c)" }
] as const;

export function MarketingInvitePreview() {
  return (
    <div className="phase-preview-ui phase-preview-ui-invite">
      <div className="invite-mini">
        <b className="display-i">Mavie Fontinhas, 1.</b>
        <small>14 MAR · 15H · jardim encantado</small>
        <button type="button">confirmar presença</button>
      </div>
      <p className="phase-preview-note">Capa com IA, RSVP, lista de convidados e contagem regressiva — tudo pronto antes do grande dia.</p>
    </div>
  );
}

export function MarketingMuralPreview() {
  return (
    <div className="phase-preview-ui phase-preview-ui-mural">
      <div className="phase-preview-ui-head">
        <span className="phase-live-badge">
          <span className="live-dot" /> mural ao vivo
        </span>
      </div>
      <div className="phase-preview-metrics">
        <div><strong>24</strong><span>presentes</span></div>
        <div><strong>18</strong><span>memórias</span></div>
      </div>
      <p className="phase-preview-note">Convidados confirmados enviam fotos e recados. O telão e o mural atualizam na hora — sem recarregar a página.</p>
      <div className="phase-preview-mural-grid">
        {muralSamples.map((item) => (
          <GuestPolaroidFrame
            key={item.src}
            src={item.src}
            alt={item.alt}
            footer={
              <footer className="guest-live-mural-card-footer">
                <span>{item.author}</span>
                <span>♥ 3</span>
              </footer>
            }
          />
        ))}
      </div>
    </div>
  );
}

export function MarketingCapsulePreview() {
  return (
    <div className="phase-preview-ui phase-preview-ui-capsule">
      <div className="phase-preview-capsule-head">
        <span className="phase-capsule-pill">mín. 36 meses guardados</span>
        <strong className="display-i">Mavie Fontinhas — 1 ano</strong>
        <small>16 mar 2026 · Espaço Jardim</small>
      </div>
      <p className="phase-preview-lock">
        <span aria-hidden="true">🔒</span> Só para revisitar — sem postar nem curtir.
      </p>
      <p className="phase-preview-note">Um ano depois, a família reabre a cápsula e revive os melhores momentos daquele dia — fotos, vídeos e recados guardados para sempre.</p>
      <div className="phase-preview-capsule-grid">
        {capsuleSamples.map((item) => (
          <GuestPolaroidFrame
            key={item.caption}
            src={item.src}
            alt={item.alt}
            caption={item.caption}
            captionStyle="polaroid"
            rotate={item.rotate}
            withTape
            tapeColor={item.tape}
          />
        ))}
      </div>
    </div>
  );
}
