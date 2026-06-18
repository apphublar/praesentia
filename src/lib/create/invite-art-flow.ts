"use client";

import { useEffect, useState } from "react";

export function useCompactInviteLayout() {
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 900px)");
    const sync = () => setCompact(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return compact;
}

export type InviteArtSubStep = "mode" | "photo" | "art" | "text";

export function inviteArtSteps(mode: "ai" | "custom"): InviteArtSubStep[] {
  return mode === "ai" ? ["mode", "photo", "art", "text"] : ["mode", "art", "text"];
}

export function inviteArtStepIndex(steps: InviteArtSubStep[], step: InviteArtSubStep) {
  return steps.indexOf(step);
}

export function inviteArtStepLabel(step: InviteArtSubStep) {
  switch (step) {
    case "mode":
      return "Como criar a imagem";
    case "photo":
      return "Foto do homenageado";
    case "art":
      return "Arte do convite";
    case "text":
      return "Texto do convite";
  }
}

export type InviteArtContinueResult = "advanced" | "complete" | "blocked";

export function inviteArtContinueBlockedMessage(step: InviteArtSubStep, photoChoice: "include" | "skip" | null) {
  switch (step) {
    case "mode":
      return "Escolha como deseja criar a imagem do convite.";
    case "photo":
      if (photoChoice === null) return "Escolha se deseja incluir a foto do homenageado.";
      if (photoChoice === "skip") return "Configure e gere a arte do convite antes de continuar.";
      return "Escolha uma opção de foto do homenageado.";
    case "art":
      return "Gere ou envie a arte do convite antes de continuar.";
    case "text":
      return "Escreva ou gere o texto do convite antes de continuar.";
  }
}
