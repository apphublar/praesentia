"use client";

import type { ReactNode } from "react";
import { Mono } from "@/components/app/ui/primitives";

export function AdminExperienceLayout({
  title,
  subtitle,
  config,
  previewLabel = "Prévia do convidado",
  preview,
  previewWide = false,
  previewDark = false,
  actions
}: {
  title: string;
  subtitle?: string;
  config: ReactNode;
  previewLabel?: string;
  preview: ReactNode;
  previewWide?: boolean;
  previewDark?: boolean;
  actions?: ReactNode;
}) {
  return (
    <div className="admin-experience-page">
      <header className="admin-experience-header">
        <div>
          <h1 className="serif-i" style={{ fontSize: "clamp(26px, 3vw, 34px)", margin: 0, lineHeight: 1.05 }}>
            {title}
          </h1>
          {subtitle ? (
            <p style={{ margin: "8px 0 0", fontSize: 14, color: "var(--muted)", lineHeight: 1.5, maxWidth: 560 }}>
              {subtitle}
            </p>
          ) : null}
        </div>
        {actions ? <div className="admin-experience-actions">{actions}</div> : null}
      </header>

      <div className={`admin-experience-grid${previewWide ? " is-wide-preview" : ""}`}>
        <section className="admin-experience-config">{config}</section>
        <section className="admin-experience-preview">
          <Mono style={{ display: "block", marginBottom: 12 }}>{previewLabel}</Mono>
          <div className={`guest-preview-device${previewWide ? " is-wide" : ""}${previewDark ? " is-dark" : ""}`}>{preview}</div>
        </section>
      </div>
    </div>
  );
}
