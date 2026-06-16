import type { ReactNode } from "react";
import { PraesentiaBrandFooter } from "@/components/brand/praesentia-logo";
import type { EventType } from "@/types/domain";
import { resolvePublicEventTheme } from "@/lib/events/event-theme-style";

export function PublicEventLayout({
  theme,
  eventType,
  children
}: {
  theme: string;
  eventType: EventType;
  children: ReactNode;
}) {
  const palette = resolvePublicEventTheme(theme, eventType);

  return (
    <div className={`public-event-page ${palette.className}`}>
      <div className="public-event-bg" aria-hidden="true">
        <span className="public-event-orb public-event-orb-a" />
        <span className="public-event-orb public-event-orb-b" />
        <span className="public-event-orb public-event-orb-c" />
      </div>
      <main className="public-event-main">{children}</main>
      <footer className="public-event-footer">
        <PraesentiaBrandFooter variant="light" />
      </footer>
    </div>
  );
}
