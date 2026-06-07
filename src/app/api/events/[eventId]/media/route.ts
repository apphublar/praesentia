import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { getCurrentSession } from "@/lib/auth/session";
import { canContribute } from "@/lib/auth/permissions";
import { repositories } from "@/lib/db";
import { canStoreMediaBytes, getRemainingStorageBytes } from "@/lib/plans";
import { publishRealtimeEvent } from "@/lib/realtime/events";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { assertTrustedOrigin } from "@/lib/security/origin";
import { sanitizeText } from "@/lib/security/sanitize";
import { buildMediaKey, createUploadUrl, getPublicMediaUrl, isEventMediaKey } from "@/lib/storage/r2";
import { validateUploadRequest } from "@/lib/storage/validation";
import type { Event, MediaItem } from "@/types/domain";

export async function POST(request: Request, context: { params: Promise<{ eventId: string }> }) {
  const originError = assertTrustedOrigin(request);
  if (originError) return originError;

  const { eventId } = await context.params;
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "Conta obrigatoria." }, { status: 401 });

  const limit = checkRateLimit(`media:${session.user.id}:${eventId}`, 12, 60_000);
  if (!limit.ok) return NextResponse.json({ error: "Muitas tentativas. Aguarde um pouco." }, { status: 429 });

  const event = await repositories.events.findById(eventId);
  if (!event) return NextResponse.json({ error: "Evento nao encontrado." }, { status: 404 });

  const member = await repositories.members.findMembership(event.id, session.user.id);
  if (!canContribute(member ?? undefined)) {
    return NextResponse.json({ error: "Somente convidados confirmados podem compartilhar memorias." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const action = sanitizeText(body?.action, 40);
  const type = sanitizeText(body?.type, 20);
  const userItems = (await repositories.media.listPublishedByEvent(eventId)).filter((item) => item.userId === session.user.id);

  if (action === "finalize_upload") {
    const key = sanitizeText(body?.key, 260);
    const contentType = sanitizeText(body?.contentType, 80);
    const size = Number(body?.size || 0);
    const validation = validateUploadRequest(contentType, size);
    if (!validation.ok) return NextResponse.json({ error: validation.error }, { status: 400 });
    if (!isEventMediaKey(eventId, key)) return NextResponse.json({ error: "Chave de arquivo invalida." }, { status: 400 });
    if (!canStoreMediaBytes(event, size)) {
      return NextResponse.json({ error: buildStorageLimitMessage(event, size) }, { status: 403 });
    }

    const mediaType = contentType.startsWith("video/") ? "video" : "photo";
    const usedCount = userItems.filter((item) => item.type === mediaType).length;
    const allowedCount = mediaType === "video" ? 1 : 2;
    if (usedCount >= allowedCount) {
      return NextResponse.json({ error: mediaType === "video" ? "Limite de 1 video atingido." : "Limite de 2 fotos atingido." }, { status: 403 });
    }

    const publicUrl = getPublicMediaUrl(key);
    const item: MediaItem = await repositories.media.create({
      eventId,
      userId: session.user.id,
      type: mediaType,
      r2Key: key,
      url: publicUrl || (mediaType === "video" ? "/placeholder-video.svg" : "/placeholder-photo.svg"),
      thumbnailUrl: publicUrl || (mediaType === "video" ? "/placeholder-video.svg" : "/placeholder-photo.svg"),
      byteSize: size
    });

    await publishRealtimeEvent({ type: "media.created", eventId, item });
    return NextResponse.json({ item }, { status: 201 });
  }

  if (type === "message") {
    if (userItems.some((item) => item.type === "message")) {
      return NextResponse.json({ error: "Limite de 1 recado atingido." }, { status: 403 });
    }
    const text = sanitizeText(body?.text, 600);
    if (text.length < 2) return NextResponse.json({ error: "Escreva um recado antes de enviar." }, { status: 400 });

    const item: MediaItem = await repositories.media.create({
      eventId,
      userId: session.user.id,
      type: "message",
      text
    });
    await publishRealtimeEvent({ type: "media.created", eventId, item });
    return NextResponse.json({ item }, { status: 201 });
  }

  const filename = sanitizeText(body?.filename, 140);
  const contentType = sanitizeText(body?.contentType, 80);
  const size = Number(body?.size || 0);
  const validation = validateUploadRequest(contentType, size);
  if (!validation.ok) return NextResponse.json({ error: validation.error }, { status: 400 });
  if (!canStoreMediaBytes(event, size)) {
    return NextResponse.json({ error: buildStorageLimitMessage(event, size) }, { status: 403 });
  }

  const mediaId = `med_${randomUUID()}`;
  const key = buildMediaKey(eventId, mediaId, filename || "upload");

  if (process.env.CLOUDFLARE_R2_BUCKET) {
    const uploadUrl = await createUploadUrl({ key, contentType, contentLength: size });
    return NextResponse.json({
      mediaId,
      key,
      uploadUrl,
      publicUrl: getPublicMediaUrl(key)
    });
  }

  return NextResponse.json({
    mediaId,
    key,
    uploadUrl: "mock://cloudflare-r2-upload-url",
    publicUrl: getPublicMediaUrl(key)
  });
}

function buildStorageLimitMessage(event: Event, requestedBytes: number) {
  const remainingMb = Math.max(0, Math.floor(getRemainingStorageBytes(event) / 1024 / 1024));
  const requestedMb = Math.ceil(requestedBytes / 1024 / 1024);
  return `Limite de armazenamento do plano ${event.plan.label} atingido. Restam ${remainingMb} MB e este arquivo tem ${requestedMb} MB.`;
}
