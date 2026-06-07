import { NextResponse } from "next/server";
import OpenAI from "openai";
import { requireSession } from "@/lib/auth/session";
import { canManageEvent } from "@/lib/auth/permissions";
import { repositories } from "@/lib/db";
import { getSql } from "@/lib/db/client";

const EVENT_TYPE_LABELS: Record<string, string> = {
  festa_infantil: "festa infantil",
  casamento: "casamento",
  aniversario: "aniversário",
  formatura: "formatura",
  corporativo: "evento corporativo",
  outros: "evento especial"
};

function buildPrompt(event: { title: string; theme: string; eventType: string; hostName: string; date: string; venueName: string; city: string }) {
  const typeLabel = EVENT_TYPE_LABELS[event.eventType] ?? "evento especial";
  const dateFormatted = new Date(event.date + "T12:00:00").toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" });

  return `Create a beautiful, elegant vertical digital invitation card for a ${typeLabel}.

Event: "${event.title}"
Honoree: ${event.hostName}
Theme: ${event.theme}
Date: ${dateFormatted}
Venue: ${event.venueName}, ${event.city}

Design requirements:
- Portrait orientation (vertical format, ideal for WhatsApp and Instagram Stories)
- Style matches the theme: ${event.theme}
- Elegant, modern, festive design appropriate for a ${typeLabel}
- Include decorative elements that match the theme
- Color palette harmonious with the theme
- Space for event details in a clear, readable layout
- Brazilian Portuguese aesthetic
- High quality, photorealistic invitation design
- NO text or typography in the image — only decorative visual elements and background design`;
}

export async function POST(_request: Request, { params }: { params: Promise<{ eventId: string }> }) {
  try {
    const session = await requireSession();
    const { eventId } = await params;

    const event = await repositories.events.findById(eventId);
    if (!event) return NextResponse.json({ error: "Evento não encontrado" }, { status: 404 });

    const membership = await repositories.members.findMembership(eventId, session.user.id);
    if (!canManageEvent(session.user, membership ?? undefined)) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "OpenAI não configurado" }, { status: 500 });

    const openai = new OpenAI({ apiKey });

    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: buildPrompt(event),
      n: 1,
      size: "1024x1792",
      quality: "standard",
      style: "vivid"
    });

    const imageUrl = response.data?.[0]?.url;
    if (!imageUrl) return NextResponse.json({ error: "Falha ao gerar imagem" }, { status: 500 });

    const sql = getSql();
    await sql`update events set cover_image_url = ${imageUrl}, updated_at = now() where id = ${eventId}`;

    return NextResponse.json({ coverImageUrl: imageUrl });
  } catch (err) {
    console.error("[generate-cover]", err);
    return NextResponse.json({ error: "Erro ao gerar imagem" }, { status: 500 });
  }
}
