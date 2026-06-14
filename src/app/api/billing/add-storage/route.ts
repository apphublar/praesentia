import { NextResponse } from "next/server";
import { apiAuthErrorResponse } from "@/lib/auth/api";
import { canManageEventById } from "@/lib/auth/event-access";
import { requireSession } from "@/lib/auth/session";
import { repositories } from "@/lib/db";
import { resolveBillingAction } from "@/lib/billing/billing-action";
import { BillingFulfillmentError, fulfillStoragePurchase } from "@/lib/billing/fulfill-checkout";
import {
  EXTRA_STORAGE_PACKAGES_GB,
  type ExtraStoragePackageGb
} from "@/lib/storage/quota";
import { assertTrustedOrigin } from "@/lib/security/origin";
import { sanitizeText } from "@/lib/security/sanitize";

export async function POST(request: Request) {
  const originError = assertTrustedOrigin(request);
  if (originError) return originError;

  try {
    const session = await requireSession();
    const body = await request.json().catch(() => ({}));
    const eventId = sanitizeText(body.eventId, 80);
    const gb = Number(body.gb);

    if (!eventId) {
      return NextResponse.json({ error: "Evento não informado." }, { status: 400 });
    }
    if (!EXTRA_STORAGE_PACKAGES_GB.includes(gb as ExtraStoragePackageGb)) {
      return NextResponse.json({ error: "Pacote de armazenamento inválido." }, { status: 400 });
    }

    const event = await repositories.events.findById(eventId);
    if (!event) return NextResponse.json({ error: "Evento não encontrado." }, { status: 404 });
    if (!event.capsuleActivatedAt) {
      return NextResponse.json({ error: "Ative a cápsula antes de expandir o armazenamento." }, { status: 403 });
    }
    if (!(await canManageEventById(session.user, eventId))) {
      return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
    }

    const packageGb = gb as ExtraStoragePackageGb;
    const resolution = await resolveBillingAction({
      checkout: {
        kind: "storage",
        userId: session.user.id,
        userEmail: session.user.email,
        eventId,
        gb: packageGb
      },
      fulfill: () => fulfillStoragePurchase(eventId, session.user.id, packageGb)
    });

    if (resolution.mode === "checkout") {
      return NextResponse.json({ mode: "checkout", checkoutUrl: resolution.checkoutUrl });
    }
    if (resolution.mode === "unavailable") {
      return NextResponse.json({ error: resolution.error }, { status: 503 });
    }

    const result = resolution.result as {
      scope: string;
      addedGb: number;
      extraStorageGb: number;
    };

    return NextResponse.json({
      mode: "fulfilled",
      scope: result.scope,
      addedGb: result.addedGb,
      extraStorageGb: result.extraStorageGb,
      message:
        result.scope === "subscription"
          ? `+${result.addedGb} GB adicionados ao pool compartilhado do Cápsula Plus.`
          : `+${result.addedGb} GB adicionados à cápsula deste evento.`
    });
  } catch (err) {
    const authError = apiAuthErrorResponse(err);
    if (authError) return authError;
    if (err instanceof BillingFulfillmentError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    console.error("[add-storage]", err);
    return NextResponse.json({ error: "Erro ao expandir armazenamento." }, { status: 500 });
  }
}
