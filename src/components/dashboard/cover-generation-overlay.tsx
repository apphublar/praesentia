"use client";

import { useEffect, useState } from "react";

const CREATION_STEPS = [
  { label: "Analisando os dados do seu convite…", weight: 12 },
  { label: "Interpretando sua orientação visual…", weight: 14 },
  { label: "Montando o layout vertical 9:16…", weight: 18 },
  { label: "Criando a arte com inteligência artificial…", weight: 32 },
  { label: "Aplicando textos na parte inferior…", weight: 14 },
  { label: "Refinando cores, tipografia e detalhes…", weight: 10 }
] as const;

const STORY_SLIDES = [
  {
    emoji: "✨",
    title: "Convite feito para WhatsApp e Stories",
    text: "A Praesentia gera convites verticais prontos para compartilhar — bonitos, legíveis e alinhados ao que você descreveu."
  },
  {
    emoji: "📺",
    title: "Mural ao vivo durante a festa",
    text: "Convidados confirmados enviam fotos, vídeos e recados. Tudo aparece no mural e no telão em tempo real, sem precisar recarregar a página."
  },
  {
    emoji: "⏳",
    title: "Cápsula do tempo — vale a pena ativar",
    text: "Depois da festa, o mesmo link vira cápsula do tempo com no mínimo 36 meses garantidos — amplie o armazenamento quando quiser."
  },
  {
    emoji: "🎉",
    title: "Do convite à memória, em um só lugar",
    text: "RSVP, lista de convidados, Pix opcional, telão ao vivo e cápsula: tudo pensado para eventos particulares de verdade."
  },
  {
    emoji: "🔒",
    title: "Privacidade em primeiro lugar",
    text: "Só quem confirma presença participa da cápsula. Você modera, bloqueia e decide o que fica visível no telão."
  },
  {
    emoji: "💡",
    title: "Dica enquanto a IA trabalha",
    text: "Ative a Cápsula Praesentia antes do evento para liberar mural, telão e moderação — seus convidados vão aproveitar muito mais a festa."
  }
] as const;

const TOTAL_WEIGHT = CREATION_STEPS.reduce((sum, step) => sum + step.weight, 0);
const ESTIMATED_MS = 240_000;

function stepIndexForProgress(progress: number) {
  let accumulated = 0;
  for (let i = 0; i < CREATION_STEPS.length; i++) {
    accumulated += CREATION_STEPS[i].weight / TOTAL_WEIGHT;
    if (progress <= accumulated || i === CREATION_STEPS.length - 1) return i;
  }
  return CREATION_STEPS.length - 1;
}

export type CoverGenerationPhase = "generating" | "composing";

export function CoverGenerationOverlay({
  active,
  capsuleActive,
  phase = "generating",
  composingWithBgRemoval = false
}: {
  active: boolean;
  capsuleActive: boolean;
  phase?: CoverGenerationPhase;
  composingWithBgRemoval?: boolean;
}) {
  const [elapsedMs, setElapsedMs] = useState(0);
  const [slideIndex, setSlideIndex] = useState(0);

  useEffect(() => {
    if (!active) {
      setElapsedMs(0);
      setSlideIndex(0);
      return;
    }

    const startedAt = Date.now();
    const tick = window.setInterval(() => {
      setElapsedMs(Date.now() - startedAt);
    }, 400);

    const slideTimer = window.setInterval(() => {
      setSlideIndex((current) => (current + 1) % STORY_SLIDES.length);
    }, 7000);

    return () => {
      window.clearInterval(tick);
      window.clearInterval(slideTimer);
    };
  }, [active]);

  useEffect(() => {
    if (!active) return;

    const warnBeforeLeave = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", warnBeforeLeave);
    return () => window.removeEventListener("beforeunload", warnBeforeLeave);
  }, [active]);

  if (!active) return null;

  const composeLabel = composingWithBgRemoval
    ? "Removendo o fundo da foto e posicionando na arte…"
    : "Posicionando a foto do homenageado na arte…";

  const rawProgress =
    phase === "composing"
      ? Math.min(0.98, 0.88 + Math.min(elapsedMs, 12_000) / 12_000 * 0.1)
      : Math.min(0.87, elapsedMs / ESTIMATED_MS);
  const progressPercent = Math.round(rawProgress * 100);
  const stepIndex = phase === "composing" ? CREATION_STEPS.length - 1 : stepIndexForProgress(rawProgress);
  const stepLabel = phase === "composing" ? composeLabel : CREATION_STEPS[stepIndex].label;
  const slide = STORY_SLIDES[slideIndex];

  return (
    <div className="cover-gen-overlay" role="dialog" aria-modal="true" aria-label="Criando convite com IA">
      <div className="cover-gen-overlay-card">
        <div className="cover-gen-overlay-head">
          <span className="cover-gen-overlay-spinner" aria-hidden="true" />
          <div>
            <p className="cover-gen-overlay-kicker">Criando seu convite</p>
            <h3 className="cover-gen-overlay-title">
              {phase === "composing" ? "Quase pronto — finalizando a capa" : "A IA está trabalhando na sua arte"}
            </h3>
          </div>
        </div>

        <div className="cover-gen-progress-track" aria-hidden="true">
          <div className="cover-gen-progress-fill" style={{ width: `${progressPercent}%` }} />
        </div>
        <p className="cover-gen-progress-label">
          {stepLabel}
          <span className="cover-gen-progress-pct">{progressPercent}%</span>
        </p>

        <article className="cover-gen-story" key={slide.title}>
          <span className="cover-gen-story-emoji" aria-hidden="true">
            {slide.emoji}
          </span>
          <div>
            <h4 className="cover-gen-story-title">{slide.title}</h4>
            <p className="cover-gen-story-text">{slide.text}</p>
          </div>
        </article>

        {!capsuleActive ? (
          <p className="cover-gen-overlay-tip">
            <strong>Próximo passo:</strong> ative a Cápsula Praesentia para liberar mural ao vivo, telão e memórias (mínimo de 36 meses, ampliável depois).
          </p>
        ) : (
          <p className="cover-gen-overlay-tip cover-gen-overlay-tip-muted">
            Isso pode levar até 4 minutos. Não feche esta página — avisaremos quando a imagem estiver pronta.
          </p>
        )}
      </div>
    </div>
  );
}
