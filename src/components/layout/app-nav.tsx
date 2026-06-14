import Link from "next/link";
import { PraesentiaLogo } from "@/components/brand/praesentia-logo";

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
          minHeight: 68,
          display: "flex",
          alignItems: "center",
          gap: 18
        }}
      >
        <PraesentiaLogo href="/" markHeight={42} wordmarkSize={23} withTape withShadow={false} />
        <nav className="nav-links" style={{ display: "flex", gap: 16, marginLeft: "auto", fontSize: 14, alignItems: "center" }}>
          <Link href="/#como-funciona">como funciona</Link>
          <Link href="/#diferencial">histórias</Link>
          <Link href="/#precos">preços</Link>
          <Link href="/eu">meu perfil</Link>
          <Link href="/login">entrar</Link>
          <Link className="btn" href="/criar" style={{ padding: "9px 13px", borderRadius: 999, boxShadow: "none", fontSize: 13 }}>
            criar grátis
          </Link>
        </nav>
      </div>
    </header>
  );
}
