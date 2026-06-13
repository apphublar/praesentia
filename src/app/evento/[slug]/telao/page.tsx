import Link from "next/link";
import { notFound } from "next/navigation";
import { PrototypeTelaoView } from "@/components/app/guest/prototype-telao-view";
import { repositories } from "@/lib/db";
import { canAccessLiveScreen } from "@/lib/plans/features";

export default async function ScreenPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = await repositories.events.findBySlugOrCode(slug);
  if (!event) notFound();

  if (!canAccessLiveScreen(event)) {
    return (
      <div className="prototype-guest-frame" style={{ padding: 40, textAlign: "center" }}>
        <h1 className="serif-i" style={{ fontSize: 32 }}>
          Telão indisponível
        </h1>
        <p style={{ color: "var(--muted)", margin: "12px 0 24px" }}>
          O telão ao vivo faz parte da Cápsula. O responsável precisa ativar o plano pago no painel do evento.
        </p>
        <Link className="btn btn-coral" href={`/evento/${event.slug}`}>
          Voltar ao convite
        </Link>
      </div>
    );
  }

  const items = await repositories.media.listPublishedByEvent(event.id);
  return <PrototypeTelaoView event={event} initialItems={items} />;
}
