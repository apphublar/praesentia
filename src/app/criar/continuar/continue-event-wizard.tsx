"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Event, InviteCopy } from "@/types/domain";
import { InviteTextEditor, type TextQuota } from "@/components/dashboard/invite-text-editor";
import { validateInviteCopyForContinue } from "@/lib/events/invite-text-validation";
import { CoverGenerator, type CoverQuota } from "@/components/dashboard/cover-generator";
import { EventSharePanel } from "@/components/dashboard/event-share-panel";

export function ContinueEventWizard({
  eventId,
  eventSlug,
  eventTitle,
  eventHostName,
  eventOrganizerName,
  eventTheme,
  eventType,
  eventDate,
  eventStartsAt,
  eventEndsAt,
  eventVenueName,
  eventVenueAddress,
  eventVenueZip,
  eventVenueComplement,
  eventCity,
  eventFormat,
  onlineMeetingUrl,
  isFundraising,
  initialCopy,
  initialCoverUrl,
  initialHostPhotoUrl,
  textQuota,
  coverQuota
}: {
  eventId: string;
  eventSlug: string;
  eventTitle: string;
  eventHostName: string;
  eventOrganizerName?: string;
  eventTheme?: string;
  eventType: Event["eventType"];
  eventDate: string;
  eventStartsAt: string;
  eventEndsAt: string;
  eventVenueName: string;
  eventVenueAddress?: string;
  eventVenueZip?: string;
  eventVenueComplement?: string;
  eventCity: string;
  eventFormat: Event["eventFormat"];
  onlineMeetingUrl?: string;
  isFundraising: boolean;
  initialCopy?: InviteCopy;
  initialCoverUrl?: string;
  initialHostPhotoUrl?: string;
  textQuota: TextQuota;
  coverQuota: CoverQuota;
}) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [copy, setCopy] = useState<InviteCopy | undefined>(initialCopy);
  const [coverUrl, setCoverUrl] = useState(initialCoverUrl ?? "");
  const [continueError, setContinueError] = useState("");

  function tryContinueToImage() {
    const validation = validateInviteCopyForContinue(copy);
    if (!validation.ok) {
      setContinueError(`Preencha: ${validation.missing.join(", ")}.`);
      return;
    }
    setContinueError("");
    setStep(2);
  }

  return (
    <div className="continue-wizard">
      <div className="continue-wizard-steps" aria-label="Progresso">
        {[
          ["1", "Texto"],
          ["2", "Imagem"],
          ["3", "Compartilhar"]
        ].map(([num, label]) => (
          <span key={num} className={`continue-wizard-step${step === Number(num) ? " is-active" : step > Number(num) ? " is-done" : ""}`}>
            {num}. {label}
          </span>
        ))}
      </div>

      {step === 1 && (
        <section className="dashboard-stack">
          <InviteTextEditor
            eventId={eventId}
            eventSlug={eventSlug}
            isFundraising={isFundraising}
            initialCopy={copy}
            initialQuota={textQuota}
            onCopyChange={setCopy}
            showContinueHints
          />
          <div className="continue-wizard-actions">
            {continueError ? <p className="settings-status is-error">{continueError}</p> : null}
            <button type="button" className="btn" onClick={tryContinueToImage}>
              Continuar para imagem →
            </button>
          </div>
        </section>
      )}

      {step === 2 && (
        <section className="dashboard-stack">
          <button type="button" className="create-back-btn" onClick={() => setStep(1)}>
            ← Voltar ao texto
          </button>
          <CoverGenerator
            eventId={eventId}
            eventSlug={eventSlug}
            planTier="free"
            capsuleActive={false}
            currentCoverUrl={coverUrl}
            hostPhotoUrl={initialHostPhotoUrl}
            inviteWhatsappText={copy?.whatsapp}
            initialQuota={coverQuota}
            onCoverChange={setCoverUrl}
            eventTitle={eventTitle}
            eventHostName={eventHostName}
            eventOrganizerName={eventOrganizerName}
            eventTheme={eventTheme}
            eventType={eventType}
            eventDate={eventDate}
            eventStartsAt={eventStartsAt}
            eventEndsAt={eventEndsAt}
            eventVenueName={eventVenueName}
            eventVenueAddress={eventVenueAddress}
            eventVenueZip={eventVenueZip}
            eventVenueComplement={eventVenueComplement}
            eventCity={eventCity}
            eventFormat={eventFormat}
            onlineMeetingUrl={onlineMeetingUrl}
          />
          <div className="continue-wizard-actions">
            <button type="button" className="btn secondary" onClick={() => setStep(1)}>
              ← Texto
            </button>
            <button type="button" className="btn" onClick={() => setStep(3)}>
              Continuar para compartilhar →
            </button>
          </div>
        </section>
      )}

      {step === 3 && (
        <section className="dashboard-stack">
          <button type="button" className="create-back-btn" onClick={() => setStep(2)}>
            ← Voltar à imagem
          </button>
          <EventSharePanel
            eventSlug={eventSlug}
            eventTitle={eventTitle}
            coverUrl={coverUrl}
            whatsappText={copy?.whatsapp}
            headline={copy?.headline}
            message={copy?.message}
          />
          <div className="continue-wizard-actions">
            <button type="button" className="btn" onClick={() => router.push(`/dashboard/eventos/${eventId}`)}>
              Ir para o painel do evento →
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
