import { NextResponse } from "next/server";
import { apiAuthErrorResponse } from "@/lib/auth/api";
import { canManageEventById } from "@/lib/auth/event-access";
import { requireSession } from "@/lib/auth/session";
import { repositories } from "@/lib/db";
import { persistImageBuffer } from "@/lib/openai/persist-image";
import { getAiCoverQuota } from "@/lib/plans/features";
import { assertTrustedOrigin } from "@/lib/security/origin";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

/** Salva capa final com foto do homenageado composta sobre a arte gerada por IA. */
export async function POST(request: Request, { params }: { params: Promise<{ eventId: string }> }) {
  const originError = assertTrustedOrigin(request);
  if (originError) return originError;

  try {
    const session = await requireSession();
    const { eventId } = await params;

    const event = await repositories.events.findById(eventId);
    if (!event) return NextResponse.json({ error: "Evento não encontrado" }, { status: 404 });

    if (!(await canManageEventById(session.user, eventId))) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Envie um arquivo de imagem." }, { status: 400 });
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json({ error: "Use JPG, PNG ou WebP." }, { status: 400 });
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "Imagem deve ter no máximo 5 MB." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const key = `events/${eventId}/cover-composed/${Date.now()}.png`;
    const dataUrl = await persistImageBuffer({
      buffer,
      key,
      contentType: file.type,
      eventId,
      maxDataUrlBytes: MAX_BYTES
    });

    const updated = await repositories.events.setCoverImage(eventId, session.user.id, {
      coverImageUrl: dataUrl,
      coverSource: "ai"
    });

    return NextResponse.json({
      coverImageUrl: updated.coverImageUrl,
      coverSource: "ai",
      quota: getAiCoverQuota(updated)
    });
  } catch (err) {
    const authError = apiAuthErrorResponse(err);
    if (authError) return authError;
    console.error("[cover-compose]", err);
    return NextResponse.json({ error: "Erro ao salvar capa composta." }, { status: 500 });
  }
}
