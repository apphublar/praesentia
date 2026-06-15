/** Convite visual da Mavie — usado na landing e no link demonstrativo. Sem botão embutido. */
export function MavieInviteArt({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`mavie-invite-art${compact ? " is-compact" : ""}`} aria-hidden={compact ? undefined : true}>
      <div className="mavie-invite-art-frame">
        <span className="mono mavie-invite-kicker">Jardim Encantado</span>
        <strong className="display-i mavie-invite-name">Mavie Fontinhas</strong>
        <em className="mavie-invite-age">faz 1 aninho!</em>
        <hr className="mavie-invite-rule" />
        <p className="mavie-invite-date">14 de março de 2026</p>
        <p className="mavie-invite-meta">às 15h · Quintal das Acácias</p>
        <p className="mavie-invite-city">São Paulo · SP</p>
        <p className="mavie-invite-note">Sua presença já é o maior presente.</p>
        <p className="mavie-invite-dress">Traje: tons de jardim, se quiser!</p>
      </div>
    </div>
  );
}
