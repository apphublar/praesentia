import { NextResponse } from "next/server";
import { apiAuthErrorResponse } from "@/lib/auth/api";
import { canManageEventById } from "@/lib/auth/event-access";
import { requireSession } from "@/lib/auth/session";
import { repositories } from "@/lib/db";
import { persistImageBuffer } from "@/lib/openai/persist-image";
import { assertTrustedOrigin } from "@/lib/security/origin";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function POST(request: Request, { params }: { params: Promise<{ eventId: string }> }) {
  const originError = assertTrustedOrigin(request);
  if (originError) return originError;

  try {
    const session = await requireSession();
    const { eventId } = await params;

    const event = await repositories.events.findById(eventId);
    if (!event) return NextResponse.json({ error: "Evento não encontrado." }, { status: 404 });

    if (!(await canManageEventById(session.user, eventId))) {
      return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Envie uma foto do aniversariante ou homenageado." }, { status: 400 });
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json({ error: "Use JPG, PNG ou WebP." }, { status: 400 });
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "A foto deve ter no máximo 5 MB." }, { status: 400 });
    }

    const ext = file.type === "image/jpeg" ? "jpg" : file.type === "image/webp" ? "webp" : "png";
    const buffer = Buffer.from(await file.arrayBuffer());
    const key = `events/${eventId}/host-photo/${Date.now()}.${ext}`;
    const hostPhotoUrl = await persistImageBuffer({
      buffer,
      key,
      contentType: file.type,
      forceDataUrl: true,
      maxDataUrlBytes: MAX_BYTES
    });

    const updated = await repositories.events.setHostPhoto(eventId, session.user.id, hostPhotoUrl);
    return NextResponse.json({ hostPhotoUrl: updated.hostPhotoUrl });
  } catch (error) {
    const authError = apiAuthErrorResponse(error);
    if (authError) return authError;
    console.error("[host-photo]", error);
    const detail = error instanceof Error ? error.message : "";
    if (/host_photo_url/i.test(detail)) {
      return NextResponse.json(
        { error: "Banco desatualizado: execute a migração 005-host-photo.sql no Supabase." },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: "Erro ao salvar foto do homenageado." }, { status: 500 });
  }
}
