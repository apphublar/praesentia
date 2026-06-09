import Link from "next/link";
import { notFound } from "next/navigation";
import { LiveScreen } from "@/components/screen/live-screen";
import { repositories } from "@/lib/db";
import { canAccessLiveScreen } from "@/lib/plans/features";

export default async function ScreenPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = await repositories.events.findBySlugOrCode(slug);
  if (!event) notFound();

  if (!canAccessLiveScreen(event)) {
    return (
      <main className="shell paper" style={{ padding: "80px 0", textAlign: "center" }}>
        <h1 className="display" style={{ fontSize: 32 }}>Telão indisponível</h1>
        <p style={{ color: "var(--ink-soft)", margin: "12px 0 24px" }}>
          O telão ao vivo faz parte da Cápsula. O responsável precisa ativar o plano pago no painel do evento.
        </p>
        <Link className="btn" href={`/evento/${event.slug}`}>Voltar ao convite</Link>
      </main>
    );
  }

  return <LiveScreen event={event} initialItems={await repositories.media.listPublishedByEvent(event.id)} />;
}
