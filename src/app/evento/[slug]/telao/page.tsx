import Link from "next/link";
import { notFound } from "next/navigation";
import { PrototypeTelaoView, type TelaoDisplayOptions } from "@/components/app/guest/prototype-telao-view";
import { repositories } from "@/lib/db";
import { canAccessLiveScreen } from "@/lib/plans/features";

function parseTelaoDisplayOptions(raw: Record<string, string | string[] | undefined>): Partial<TelaoDisplayOptions> {
  const layoutRaw = Array.isArray(raw.layout) ? raw.layout[0] : raw.layout;
  const fitRaw = Array.isArray(raw.fit) ? raw.fit[0] : raw.fit;
  const thumbsRaw = Array.isArray(raw.thumbs) ? raw.thumbs[0] : raw.thumbs;

  const layout = layoutRaw === "single" || layoutRaw === "double" || layoutRaw === "triple" || layoutRaw === "hero_two"
    ? layoutRaw
    : undefined;
  const fit = fitRaw === "contain" || fitRaw === "cover" ? fitRaw : undefined;
  const thumbsValue = Number(thumbsRaw);
  const thumbs = thumbsValue === 4 || thumbsValue === 6 || thumbsValue === 8 ? thumbsValue : undefined;

  return { layout, fit, thumbs };
}

export default async function ScreenPage({
  params,
  searchParams
}: {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const query = (await searchParams) ?? {};
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
  const displayOptions = parseTelaoDisplayOptions(query);
  return <PrototypeTelaoView event={event} initialItems={items} displayOptions={displayOptions} />;
}
