import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { canContribute } from "@/lib/auth/permissions";
import { canManageEventById } from "@/lib/auth/event-access";
import { getCurrentSession } from "@/lib/auth/session";
import { repositories } from "@/lib/db";
import { publishRealtimeEvent } from "@/lib/realtime/events";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { assertTrustedOrigin } from "@/lib/security/origin";
import { sanitizeText } from "@/lib/security/sanitize";
import { resolveStorageContext } from "@/lib/storage/context";
import { assessGuestPhotoUpload, countConfirmedGuests } from "@/lib/storage/guest-upload-limits";
import { canAcceptStorageUpload, buildStorageLimitMessage } from "@/lib/storage/quota";
import { buildMediaKey, createUploadUrl, getPublicMediaUrl, isEventMediaKey } from "@/lib/storage/r2";
import { validateUploadRequest } from "@/lib/storage/validation";
import type { MediaItem } from "@/types/domain";

export async function POST(request: Request, context: { params: Promise<{ eventId: string }> }) {
  const originError = assertTrustedOrigin(request);
  if (originError) return originError;

  const { eventId } = await context.params;
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "Conta obrigatória." }, { status: 401 });

  const limit = checkRateLimit(`media:${session.user.id}:${eventId}`, 12, 60_000);
  if (!limit.ok) return NextResponse.json({ error: "Muitas tentativas. Aguarde um pouco." }, { status: 429 });

  const event = await repositories.events.findById(eventId);
  if (!event) return NextResponse.json({ error: "Evento não encontrado." }, { status: 404 });

  const member = await repositories.members.findMembership(event.id, session.user.id);
  if (!canContribute(event, member ?? undefined)) {
    if (!event.capsuleActivatedAt) {
      return NextResponse.json({ error: "Mural ao vivo disponível apenas com a Cápsula ativa." }, { status: 403 });
    }
    return NextResponse.json({ error: "Somente convidados confirmados podem compartilhar memórias." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const action = sanitizeText(body?.action, 40);
  const type = sanitizeText(body?.type, 20);
  const isManager = await canManageEventById(session.user, eventId);
  const eventItems = await repositories.media.listPublishedByEvent(eventId);
  const userItems = eventItems.filter((item) => item.userId === session.user.id);
  const [rsvps, members] = await Promise.all([
    repositories.guestRsvps.listByEvent(eventId),
    repositories.members.listByEvent(eventId)
  ]);
  const confirmedGuestCount = countConfirmedGuests(rsvps.length, members);

  if (action === "finalize_upload") {
    const key = sanitizeText(body?.key, 260);
    const contentType = sanitizeText(body?.contentType, 80);
    const size = Number(body?.size || 0);
    const validation = validateUploadRequest(contentType, size);
    if (!validation.ok) return NextResponse.json({ error: validation.error }, { status: 400 });
    if (!isEventMediaKey(eventId, key)) return NextResponse.json({ error: "Chave de arquivo inválida." }, { status: 400 });

    const mediaType = contentType.startsWith("video/") ? "video" : "photo";
    if (mediaType === "video" && !isManager) {
      return NextResponse.json({ error: "Somente o responsável do evento pode enviar vídeos." }, { status: 403 });
    }

    const storageContext = await resolveStorageContext(event);

    if (!isManager && mediaType === "photo") {
      const photoCheck = assessGuestPhotoUpload({
        confirmedGuestCount,
        eventItems,
        guestPhotoCount: userItems.filter((item) => item.type === "photo").length,
        incomingBytes: size,
        poolUsedBytes: storageContext.poolUsedBytes,
        snapshot: storageContext.snapshot,
        event,
        subscription: storageContext.subscription
      });
      if (!photoCheck.ok) return NextResponse.json({ error: photoCheck.error }, { status: 403 });
    } else if (
      !canAcceptStorageUpload({
        event,
        subscription: storageContext.subscription,
        poolUsedBytes: storageContext.poolUsedBytes,
        incomingBytes: size
      })
    ) {
      return NextResponse.json({ error: buildStorageLimitMessage(storageContext.snapshot, size) }, { status: 403 });
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
    if (!isManager && userItems.some((item) => item.type === "message")) {
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

  if (validation.isVideo && !isManager) {
    return NextResponse.json({ error: "Somente o responsável do evento pode enviar vídeos." }, { status: 403 });
  }

  const storageContext = await resolveStorageContext(event);

  if (!isManager && !validation.isVideo) {
    const photoCheck = assessGuestPhotoUpload({
      confirmedGuestCount,
      eventItems,
      guestPhotoCount: userItems.filter((item) => item.type === "photo").length,
      incomingBytes: size,
      poolUsedBytes: storageContext.poolUsedBytes,
      snapshot: storageContext.snapshot,
      event,
      subscription: storageContext.subscription
    });
    if (!photoCheck.ok) return NextResponse.json({ error: photoCheck.error }, { status: 403 });
  } else if (
    !canAcceptStorageUpload({
      event,
      subscription: storageContext.subscription,
      poolUsedBytes: storageContext.poolUsedBytes,
      incomingBytes: size
    })
  ) {
    return NextResponse.json({ error: buildStorageLimitMessage(storageContext.snapshot, size) }, { status: 403 });
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
