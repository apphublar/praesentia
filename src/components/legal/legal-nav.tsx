import Link from "next/link";
import { LEGAL_PAGES } from "@/lib/legal/constants";

export function LegalNav({ current }: { current?: string }) {
  return (
    <nav className="legal-nav" aria-label="Documentos legais">
      <p className="legal-nav-label">Documentos legais</p>
      <ul>
        {LEGAL_PAGES.map(({ href, label }) => (
          <li key={href}>
            {current === href ? (
              <span aria-current="page">{label}</span>
            ) : (
              <Link href={href}>{label}</Link>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}
