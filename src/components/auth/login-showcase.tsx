const phases = [
  {
    phase: "Antes",
    title: "Convite digital",
    text: "Capa com IA, RSVP, contagem regressiva e Pix opcional — tudo privado.",
    color: "var(--coral)"
  },
  {
    phase: "Durante",
    title: "Mural ao vivo",
    text: "Convidados compartilham fotos e recados. O telão atualiza em tempo real.",
    color: "var(--gold)"
  },
  {
    phase: "Depois",
    title: "Cápsula do tempo",
    text: "O mesmo evento vira memória guardada por no mínimo 36 meses.",
    color: "var(--violet)"
  }
];

export function LoginShowcase() {
  return (
    <aside className="card login-showcase" aria-label="Sobre a Praesentia">
      <span className="pill">
        <span style={{ width: 6, height: 6, borderRadius: 999, background: "var(--coral)" }} />
        eventos privados
      </span>
      <h2 className="display-i login-showcase-title">
        Festas que viram
        <br />
        <span style={{ color: "var(--coral)" }}>memória guardada</span>.
      </h2>
      <p className="login-showcase-lead">
        Convite, RSVP, mural ao vivo e cápsula do tempo — tudo no mesmo lugar.
      </p>
      <p className="login-showcase-lead login-showcase-lead-sub">
        Pensado para aniversários, casamentos e festas em família.
      </p>

      <ol className="login-showcase-phases">
        {phases.map((item) => (
          <li key={item.phase}>
            <span className="login-showcase-phase-dot" style={{ background: item.color }} aria-hidden />
            <div>
              <div className="login-showcase-phase-label">{item.phase}</div>
              <strong>{item.title}</strong>
              <p>{item.text}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="login-showcase-foot">
        <div className="login-showcase-stat">
          <span className="login-showcase-stat-value">36+</span>
          <span className="login-showcase-stat-label">meses de guarda garantidos</span>
        </div>
        <div className="login-showcase-stat">
          <span className="login-showcase-stat-value">1</span>
          <span className="login-showcase-stat-label">link único do evento</span>
        </div>
      </div>
    </aside>
  );
}
