import Link from "next/link";

export function AppNav() {
  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 20,
        background: "rgba(247, 238, 219, 0.92)",
        borderBottom: "1px solid var(--line)",
        backdropFilter: "blur(12px)"
      }}
    >
      <div
        className="shell"
        style={{
          minHeight: 64,
          display: "flex",
          alignItems: "center",
          gap: 18
        }}
      >
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, fontWeight: 800 }}>
          <span
            style={{
              width: 34,
              height: 34,
              borderRadius: 999,
              border: "1px solid var(--ink)",
              display: "inline-grid",
              placeItems: "center"
            }}
          >
            <span style={{ width: 10, height: 10, borderRadius: 999, background: "var(--coral)" }} />
          </span>
          Praesentia
        </Link>
        <nav className="nav-links" style={{ display: "flex", gap: 16, marginLeft: "auto", fontSize: 14, alignItems: "center" }}>
          <Link href="/#como-funciona">como funciona</Link>
          <Link href="/#diferencial">histórias</Link>
          <Link href="/#precos">precos</Link>
          <Link href="/eu">meu perfil</Link>
          <Link href="/login">entrar</Link>
          <Link className="btn" href="/criar" style={{ padding: "9px 13px", borderRadius: 999, boxShadow: "none", fontSize: 13 }}>
            criar gratis
          </Link>
        </nav>
      </div>
    </header>
  );
}
