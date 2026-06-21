import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { canManageEventById } from "@/lib/auth/event-access";
import { getCurrentSession } from "@/lib/auth/session";
import { repositories } from "@/lib/db";
import { resolveMuralContributor } from "@/lib/mural/media-auth";
import { publishRealtimeEvent } from "@/lib/realtime/events";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { assertTrustedOrigin } from "@/lib/security/origin";
import { sanitizeText } from "@/lib/security/sanitize";
import { resolveStorageContext } from "@/lib/storage/context";
import { assessGuestPhotoUpload } from "@/lib/storage/guest-upload-limits";
import { canAcceptStorageUpload, buildStorageLimitMessage } from "@/lib/storage/quota";
import { buildMediaKey, createUploadUrl, getPublicMediaUrl, isEventMediaKey } from "@/lib/storage/r2";
import { resolveStoredMediaUrl } from "@/lib/storage/media-url";
import { validateUploadRequest } from "@/lib/storage/validation";
import type { MediaItem } from "@/types/domain";

export async function POST(request: Request, context: { params: Promise<{ eventId: string }> }) {
  const originError = assertTrustedOrigin(request);
  if (originError) return originError;

  const { eventId } = await context.params;
  const session = await getCurrentSession();
  const event = await repositories.events.findById(eventId);
  if (!event) return NextResponse.json({ error: "Evento não encontrado." }, { status: 404 });

  const contributor = await resolveMuralContributor(event);
  if (!contributor) {
    if (!event.capsuleActivatedAt) {
      return NextResponse.json({ error: "Mural ao vivo disponível apenas com a Cápsula ativa." }, { status: 403 });
    }
    return NextResponse.json({ error: "Acesso ao mural indisponível no momento." }, { status: 403 });
  }

  const rateKey =
    contributor.kind === "guest" ? `media:guest:${contributor.guestRsvpId}:${eventId}` : `media:${contributor.userId}:${eventId}`;
  const limit = checkRateLimit(rateKey, 12, 60_000);
  if (!limit.ok) return NextResponse.json({ error: "Muitas tentativas. Aguarde um pouco." }, { status: 429 });

  const body = await request.json().catch(() => null);
  const action = sanitizeText(body?.action, 40);
  const type = sanitizeText(body?.type, 20);
  const isManager =
    contributor.kind === "manager" &&
    Boolean(session && (await canManageEventById(session.user, eventId)));
  const eventItems = await repositories.media.listPublishedByEvent(eventId);
  const userItems =
    contributor.kind === "guest"
      ? eventItems.filter((item) => item.guestRsvpId === contributor.guestRsvpId)
      : eventItems.filter((item) => item.userId === contributor.userId);

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

    const publicUrl = resolveStoredMediaUrl(eventId, key, getPublicMediaUrl(key));
    const caption = sanitizeText(body?.caption, 80);
    const item: MediaItem = await repositories.media.create({
      eventId,
      userId: contributor.userId,
      guestRsvpId: contributor.kind === "guest" ? contributor.guestRsvpId : undefined,
      authorDisplayName: contributor.authorName,
      type: mediaType,
      caption: caption || undefined,
      r2Key: key,
      url: publicUrl,
      thumbnailUrl: publicUrl,
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
      userId: contributor.userId,
      guestRsvpId: contributor.kind === "guest" ? contributor.guestRsvpId : undefined,
      authorDisplayName: contributor.authorName,
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
