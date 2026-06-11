import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { repositories } from "@/lib/db";
import { canAccessCapsule } from "@/lib/plans/features";
import { assertTrustedOrigin } from "@/lib/security/origin";
import { sanitizeText } from "@/lib/security/sanitize";
import type { GuestCompanionDetail } from "@/types/domain";

export async function POST(request: Request, { params }: { params: Promise<{ eventId: string }> }) {
  const originError = assertTrustedOrigin(request);
  if (originError) return originError;

  try {
    const { eventId } = await params;
    const session = await getCurrentSession();

    const event = await repositories.events.findById(eventId);
    if (!event) return NextResponse.json({ error: "Evento não encontrado" }, { status: 404 });

    const body = await request.json();
    const guestFirstName = sanitizeText(body.guestFirstName, 80);
    const guestLastName = sanitizeText(body.guestLastName, 80);
    const guestName =
      sanitizeText(body.guestName, 120) || `${guestFirstName} ${guestLastName}`.trim();
    const guestEmail = body.guestEmail ? sanitizeText(body.guestEmail, 160) : undefined;
    const phone = body.phone ? sanitizeText(body.phone, 20) : undefined;
    const rawCompanions = Array.isArray(body.companionNames) ? body.companionNames : [];
    const companionNames = rawCompanions
      .map((name: unknown) => sanitizeText(String(name ?? ""), 120))
      .filter(Boolean);
    const rawDetail = Array.isArray(body.companionsDetail) ? body.companionsDetail : [];
    const companionsDetail: GuestCompanionDetail[] = [];
    for (const item of rawDetail) {
      if (!item || typeof item !== "object") continue;
      const row = item as { name?: unknown; type?: unknown; age?: unknown };
      const name = sanitizeText(String(row.name ?? ""), 120);
      if (!name) continue;
      const type: GuestCompanionDetail["type"] = row.type === "child" ? "child" : "adult";
      const age = row.age != null && row.age !== "" ? Number(row.age) : undefined;
      companionsDetail.push({ name, type, age: Number.isFinite(age) ? age : undefined });
    }
    const companionName = body.companionName ? sanitizeText(body.companionName, 120) : companionNames[0];
    const rsvpStatus = body.rsvpStatus === "declined" ? "declined" : "confirmed";
    const pixContributedAmount =
      body.pixContributedAmount != null ? Number(body.pixContributedAmount) : undefined;
    const termsAcceptedAt = body.termsAcceptedAt ? String(body.termsAcceptedAt) : undefined;
    const wantsCapsule = Boolean(body.wantsCapsule) && canAccessCapsule(event);

    if (!guestName) {
      return NextResponse.json({ error: "Informe seu nome para confirmar presença." }, { status: 400 });
    }
    if (!termsAcceptedAt) {
      return NextResponse.json(
        { error: "É necessário aceitar os Termos de Uso e a Política de Privacidade." },
        { status: 400 }
      );
    }
    if (!guestEmail || !phone) {
      return NextResponse.json({ error: "Informe e-mail e WhatsApp." }, { status: 400 });
    }

    const rsvp = await repositories.guestRsvps.create({
      eventId,
      guestName,
      guestFirstName: guestFirstName || undefined,
      guestLastName: guestLastName || undefined,
      guestEmail,
      phone,
      companionName: companionName || undefined,
      companionNames: companionNames.length ? companionNames : companionName ? [companionName] : [],
      companionsDetail: companionsDetail.length ? companionsDetail : undefined,
      rsvpStatus,
      pixContributedAmount:
        Number.isFinite(pixContributedAmount) && pixContributedAmount! > 0
          ? pixContributedAmount
          : undefined,
      termsAcceptedAt,
      wantsCapsule
    });

    if (session) {
      await repositories.members.ensureGuestMembership(eventId, session.user.id);
    }

    return NextResponse.json({ rsvp });
  } catch (err) {
    console.error("[rsvp]", err);
    const detail = err instanceof Error ? err.message : "";
    if (/relation "guest_rsvps" does not exist/i.test(detail)) {
      return NextResponse.json(
        { error: "Banco desatualizado. Execute a migração 001-plan-flow.sql no Supabase." },
        { status: 503 }
      );
    }
    if (/companion_names|companion_name|column.*does not exist/i.test(detail)) {
      return NextResponse.json(
        { error: "Banco desatualizado. Execute as migrações 007 e 008 no Supabase." },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: "Erro ao confirmar presença." }, { status: 500 });
  }
}
