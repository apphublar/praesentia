import type { ReactNode } from "react";

export function AdminStatCard({
  label,
  value,
  hint,
  accent
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  accent?: string;
}) {
  return (
    <article className="platform-admin-stat">
      <p className="platform-admin-stat-label">{label}</p>
      <strong style={accent ? { color: accent } : undefined}>{value}</strong>
      {hint ? <span>{hint}</span> : null}
    </article>
  );
}
