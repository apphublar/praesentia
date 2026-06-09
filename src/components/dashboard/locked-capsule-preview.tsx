import Link from "next/link";

export function LockedCapsulePreview({ eventId }: { eventId: string }) {
  return (
    <article className="card dashboard-card locked-capsule-preview">
      <span className="pill">cápsula · mural · telão</span>
      <h2 className="display" style={{ fontSize: 28, margin: "12px 0 8px" }}>Recursos pagos bloqueados</h2>
      <p style={{ color: "var(--ink-soft)", lineHeight: 1.6 }}>
        Mural ao vivo, telão e cápsula do tempo ficam disponíveis após ativar a Cápsula (R$59) ou o Cápsula Plus.
        Seus convidados não veem essas áreas no plano gratuito.
      </p>
      <ul style={{ color: "var(--ink-soft)", lineHeight: 1.7, paddingLeft: 18 }}>
        <li>Fotos e recados em tempo real no mural</li>
        <li>Telão ao vivo na festa</li>
        <li>Cápsula do tempo por 36 meses</li>
      </ul>
      <Link className="btn" href={`#ativar-capsula-${eventId}`}>
        Ver planos e ativar
      </Link>
    </article>
  );
}
