import type { ReactNode } from "react";
import Link from "next/link";
import { AppNav } from "@/components/layout/app-nav";
import { LegalNav } from "@/components/legal/legal-nav";
import { SiteFooter } from "@/components/marketing/extra-sections";

export function LegalPageShell({
  title,
  updatedAt,
  currentPath,
  children
}: {
  title: string;
  updatedAt: string;
  currentPath?: string;
  children: ReactNode;
}) {
  return (
    <>
      <AppNav />
      <main className="shell paper" style={{ padding: "44px 0 80px", maxWidth: 760 }}>
        <Link href="/" className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>
          ← Voltar ao site
        </Link>
        <h1 className="display-i" style={{ fontSize: "clamp(36px, 5vw, 52px)", margin: "16px 0 8px" }}>
          {title}
        </h1>
        <p className="mono" style={{ color: "var(--muted)", fontSize: 11, marginBottom: 32 }}>
          Última atualização: {updatedAt}
        </p>
        <article className="legal-prose">{children}</article>
        <LegalNav current={currentPath} />
      </main>
      <SiteFooter />
    </>
  );
}
