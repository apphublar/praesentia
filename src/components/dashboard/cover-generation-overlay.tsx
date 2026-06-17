"use client";

import { useEffect, useState } from "react";
import { Icon, type IconName } from "@/components/app/ui/icon";

const CREATION_STEPS = [
  { label: "Analisando os dados do seu convite…", weight: 12 },
  { label: "Interpretando sua orientação visual…", weight: 14 },
  { label: "Montando o layout vertical 9:16…", weight: 18 },
  { label: "Criando a arte com inteligência artificial…", weight: 32 },
  { label: "Aplicando textos na parte inferior…", weight: 14 },
  { label: "Refinando cores, tipografia e detalhes…", weight: 10 }
] as const;

const STORY_SLIDES: ReadonlyArray<{ icon: IconName; title: string; text: string }> = [
  {
    icon: "image",
    title: "Convite feito para WhatsApp e Stories",
    text: "A Praesentia gera convites verticais prontos para compartilhar — bonitos, legíveis e alinhados ao que você descreveu."
  },
  {
    icon: "proj",
    title: "Mural ao vivo durante a festa",
    text: "Convidados confirmados enviam fotos, vídeos e recados. Tudo aparece no mural e no telão em tempo real, sem precisar recarregar a página."
  },
  {
    icon: "hourglass",
    title: "Cápsula do tempo — vale a pena ativar",
    text: "Depois da festa, o mesmo link vira cápsula do tempo com no mínimo 36 meses garantidos — amplie o armazenamento quando quiser."
  },
  {
    icon: "gift",
    title: "Do convite à memória, em um só lugar",
    text: "RSVP, lista de convidados, Pix opcional, telão ao vivo e cápsula: tudo pensado para eventos particulares de verdade."
  },
  {
    icon: "lock",
    title: "Privacidade em primeiro lugar",
    text: "Só quem confirma presença participa da cápsula. Você modera, bloqueia e decide o que fica visível no telão."
  },
  {
    icon: "spark",
    title: "Dica enquanto a IA trabalha",
    text: "Ative a Cápsula Praesentia antes do evento para liberar mural, telão e moderação — seus convidados vão aproveitar muito mais a festa."
  }
];

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

    let wakeLock: WakeLockSentinel | null = null;
    if ("wakeLock" in navigator) {
      void navigator.wakeLock.request("screen").then((lock) => {
        wakeLock = lock;
      }).catch(() => {
        // unsupported or denied
      });
    }

    return () => {
      window.removeEventListener("beforeunload", warnBeforeLeave);
      void wakeLock?.release();
    };
  }, [active]);

  if (!active) return null;

  const composeLabel = composingWithBgRemoval
    ? "Removendo o fundo da foto e posicionando na arte…"
    : "Posicionando a foto do homenageado na arte…";

  const rawProgress =
    phase === "composing"
      ? Math.min(0.98, 0.88 + (Math.min(elapsedMs, 12_000) / 12_000) * 0.1)
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
          <span className="cover-gen-story-icon" aria-hidden="true">
            <Icon name={slide.icon} size={22} sw={1.8} />
          </span>
          <div>
            <h4 className="cover-gen-story-title">{slide.title}</h4>
            <p className="cover-gen-story-text">{slide.text}</p>
          </div>
        </article>

        {!capsuleActive ? (
          <p className="cover-gen-overlay-tip">
            <strong>Pode responder o WhatsApp:</strong> a imagem continua sendo criada no servidor. Ao voltar, ela aparecerá aqui automaticamente.
          </p>
        ) : (
          <p className="cover-gen-overlay-tip cover-gen-overlay-tip-muted">
            Isso pode levar alguns minutos. Você pode sair do app — quando voltar, retomamos de onde parou.
          </p>
        )}
      </div>
    </div>
  );
}
