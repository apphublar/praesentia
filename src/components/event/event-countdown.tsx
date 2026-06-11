"use client";

import { useEffect, useMemo, useState } from "react";
import { getEventStartDate } from "@/lib/events/phase";
import type { Event } from "@/types/domain";

function formatRemaining(ms: number) {
  if (ms <= 0) return { days: 0, hours: 0, minutes: 0 };
  const totalMinutes = Math.floor(ms / 60000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;
  return { days, hours, minutes };
}

export function EventCountdown({ event, label }: { event: Event; label: string }) {
  const target = useMemo(() => getEventStartDate(event), [event]);
  const [remaining, setRemaining] = useState(() => formatRemaining(target.getTime() - Date.now()));

  useEffect(() => {
    const timer = window.setInterval(() => {
      setRemaining(formatRemaining(target.getTime() - Date.now()));
    }, 30_000);
    return () => window.clearInterval(timer);
  }, [target]);

  return (
    <article className="public-event-card public-event-countdown">
      <h2 className="public-event-section-title">{label}</h2>
      <div className="public-countdown-grid">
        <div><strong>{remaining.days}</strong><span>dias</span></div>
        <div><strong>{remaining.hours}</strong><span>horas</span></div>
        <div><strong>{remaining.minutes}</strong><span>min</span></div>
      </div>
    </article>
  );
}
