"use server";

import { revalidatePath } from "next/cache";
import { adminRepository, repositories } from "@/lib/db";
import { getSql } from "@/lib/db/client";
import { requirePlatformAdmin } from "@/lib/auth/session";
import {
  fulfillAiInvitePlan,
  fulfillCapsulePurchase,
  fulfillPlusSubscription,
  fulfillStoragePurchase
} from "@/lib/billing/fulfill-checkout";
import { getAppBaseUrl, getAuthRecoveryCallbackUrl } from "@/lib/app-url";
import { bytesFromGb, PLANS } from "@/lib/plans";
import type { PlanTier } from "@/types/domain";
import type { AiInviteUpgradePlan } from "@/lib/plans/ai-invite-plans";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSessionToken, SESSION_COOKIE_NAME, buildSessionCookieOptions } from "@/lib/auth/session-cookie";
import { cookies } from "next/headers";

export type AdminActionState = {
  ok?: boolean;
  error?: string;
  message?: string;
  resetLink?: string;
  whatsappUrl?: string;
};

async function assertAdmin() {
  const session = await requirePlatformAdmin();
  return session;
}

export async function adminBlockUser(userId: string, blocked: boolean): Promise<AdminActionState> {
  try {
    const session = await assertAdmin();
    if (session.user.id === userId) return { error: "Você não pode bloquear a própria conta." };
    await adminRepository.setUserBlocked(userId, blocked, session.user.id);
    revalidatePath("/admin/clientes");
    return { ok: true, message: blocked ? "Cliente bloqueado." : "Cliente desbloqueado." };
  } catch {
    return { error: "Não foi possível atualizar o status do cliente." };
  }
}

export async function adminSaveUserNotes(userId: string, notes: string): Promise<AdminActionState> {
  try {
    const session = await assertAdmin();
    await adminRepository.setUserNotes(userId, notes, session.user.id);
    revalidatePath("/admin/clientes");
    return { ok: true, message: "Notas salvas." };
  } catch {
    return { error: "Não foi possível salvar as notas." };
  }
}

export async function adminActivateCapsule(
  eventId: string,
  userId: string,
  plan: "capsule" | "family" = "capsule"
): Promise<AdminActionState> {
  try {
    const session = await assertAdmin();
    if (plan === "family") {
      const existingSubscription = await repositories.subscriptions.findActiveByUser(userId);
      if (!existingSubscription) {
        const subscription = await fulfillPlusSubscription(userId);
        await repositories.audit.record({
          actorUserId: session.user.id,
          eventId: null,
          action: "admin.plus_granted",
          targetType: "subscription",
          targetId: subscription.id,
          metadata: { grantedTo: userId, priceBrl: 0, priceLabel: "Cortesia admin", plan: "family" }
        });
      }
    }
    await fulfillCapsulePurchase(eventId, userId, plan);
    await repositories.audit.record({
      actorUserId: session.user.id,
      eventId,
      action: plan === "family" ? "admin.plus_event_granted" : "admin.capsule_granted",
      targetType: "event",
      targetId: eventId,
      metadata: { grantedTo: userId, priceBrl: 0, priceLabel: "Cortesia admin", plan }
    });
    revalidatePath("/admin/clientes");
    revalidatePath(`/dashboard/eventos/${eventId}`);
    return { ok: true, message: plan === "family" ? "Vaga Plus liberada para o evento." : "Cápsula liberada para o evento." };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Falha ao liberar plano." };
  }
}

export async function adminActivatePlus(userId: string): Promise<AdminActionState> {
  try {
    const session = await assertAdmin();
    const subscription = await fulfillPlusSubscription(userId);
    await repositories.audit.record({
      actorUserId: session.user.id,
      eventId: null,
      action: "admin.plus_granted",
      targetType: "subscription",
      targetId: subscription.id,
      metadata: { grantedTo: userId, priceBrl: 0, priceLabel: "Cortesia admin", plan: "family" }
    });
    revalidatePath("/admin/clientes");
    return { ok: true, message: "Cápsula Plus liberado para o cliente." };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Falha ao liberar Cápsula Plus." };
  }
}

export async function adminSetEventPlan(
  eventId: string,
  userId: string,
  plan: PlanTier
): Promise<AdminActionState> {
  try {
    const session = await assertAdmin();
    const event = await repositories.events.findById(eventId);
    if (!event) return { error: "Evento não encontrado." };

    if (plan === "family") {
      const existingSubscription = await repositories.subscriptions.findActiveByUser(userId);
      if (!existingSubscription) {
        const subscription = await fulfillPlusSubscription(userId);
        await repositories.audit.record({
          actorUserId: session.user.id,
          eventId: null,
          action: "admin.plus_granted",
          targetType: "subscription",
          targetId: subscription.id,
          metadata: { grantedTo: userId, priceBrl: 0, priceLabel: "Cortesia admin", plan: "family" }
        });
      }
    }

    const planConfig = PLANS[plan];
    const storageLimitBytes = plan === "family" ? 0 : bytesFromGb(planConfig.storageGb);
    const extraStorageBytes = plan === "free" ? 0 : Math.round(event.extraStorageGb * 1024 ** 3);
    const wasFamily = event.plan.tier === "family" && event.capsuleActivatedAt;
    const willBeFamily = plan === "family";
    const sql = getSql();
    await sql.begin(async (tx) => {
      if (wasFamily && !willBeFamily) {
        await tx`
          update user_subscriptions
          set events_used_this_period = greatest(events_used_this_period - 1, 0), updated_at = now()
          where user_id = ${userId}
            and status = 'active'
            and current_period_start <= now()
            and current_period_end >= now()
        `;
      }
      if (!wasFamily && willBeFamily) {
        await tx`
          update user_subscriptions
          set events_used_this_period = events_used_this_period + 1, updated_at = now()
          where user_id = ${userId}
            and status = 'active'
            and current_period_start <= now()
            and current_period_end >= now()
        `;
      }
      await tx`
        update events
        set
          plan_tier = ${plan},
          storage_limit_bytes = ${storageLimitBytes},
          extra_storage_bytes = ${extraStorageBytes},
          capsule_activated_at = ${plan === "free" ? null : new Date().toISOString()},
          updated_at = now()
        where id = ${eventId}
      `;
      await tx`
        update screen_settings
        set enabled = ${plan !== "free"}, updated_at = now()
        where event_id = ${eventId}
      `;
    });

    await repositories.audit.record({
      actorUserId: session.user.id,
      eventId,
      action: "admin.event_plan_set",
      targetType: "event",
      targetId: eventId,
      metadata: { grantedTo: userId, from: event.plan.tier, to: plan, priceBrl: 0, priceLabel: "Cortesia admin" }
    });

    revalidatePath("/admin/clientes");
    revalidatePath("/dashboard");
    revalidatePath(`/dashboard/eventos/${eventId}`);
    return { ok: true, message: `Plano do evento alterado para ${planConfig.label}.` };
  } catch (error) {
    console.error("[admin] adminSetEventPlan failed", error);
    return { error: error instanceof Error ? error.message : "Falha ao alterar plano do evento." };
  }
}

export async function adminAddStorage(eventId: string, userId: string, gb: number): Promise<AdminActionState> {
  try {
    const session = await assertAdmin();
    if (![5, 10, 25, 50].includes(gb)) return { error: "Pacote de GB inválido." };
    await fulfillStoragePurchase(eventId, userId, gb);
    await repositories.audit.record({
      actorUserId: session.user.id,
      eventId,
      action: "admin.storage_granted",
      targetType: "event",
      targetId: eventId,
      metadata: { gb, grantedTo: userId, priceBrl: 0, priceLabel: "Cortesia admin" }
    });
    revalidatePath("/admin/clientes");
    return { ok: true, message: `+${gb} GB adicionados.` };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Falha ao adicionar armazenamento." };
  }
}

export async function adminAddCreativeAttempts(
  userId: string,
  plan: AiInviteUpgradePlan
): Promise<AdminActionState> {
  try {
    const session = await assertAdmin();
    await repositories.users.purchaseAiInvitePlan(userId, plan);
    await repositories.audit.record({
      actorUserId: session.user.id,
      eventId: null,
      action: "admin.ai_invite_granted",
      targetType: "user",
      targetId: userId,
      metadata: { plan, priceBrl: 0, priceLabel: "Cortesia admin" }
    });
    revalidatePath("/admin/clientes");
    return { ok: true, message: "Tentativas criativas adicionadas." };
  } catch {
    return { error: "Falha ao adicionar tentativas." };
  }
}

export async function adminRequestPasswordReset(userId: string): Promise<AdminActionState> {
  try {
    const session = await assertAdmin();
    const detail = await adminRepository.getUserDetail(userId);
    if (!detail) return { error: "Cliente não encontrado." };
    if (detail.user.role === "platform_admin" && detail.user.id !== session.user.id) {
      return { error: "Contas de administrador devem redefinir a senha em Configurações." };
    }

    const supabase = createSupabaseAdminClient();
    const redirectTo = getAuthRecoveryCallbackUrl();
    const { data, error } = await supabase.auth.admin.generateLink({
      type: "recovery",
      email: detail.user.email,
      options: { redirectTo }
    });

    const resetLink = data?.properties?.action_link;
    if (error || !resetLink) {
      console.error("[admin] generateLink recovery failed", error);
      return { error: "Não foi possível gerar o link de redefinição de senha." };
    }

    const whatsappMessage = `Olá ${detail.user.name}, aqui é da equipe Praesentia.\n\nClique no link abaixo para criar uma nova senha de acesso:\n\n${resetLink}\n\nDepois de salvar, entre com seu email e a nova senha em ${getAppBaseUrl()}/login\n\nSe não solicitou essa alteração, ignore esta mensagem.`;

    await repositories.audit.record({
      actorUserId: session.user.id,
      eventId: null,
      action: "admin.password_reset_link",
      targetType: "user",
      targetId: userId,
      metadata: { email: detail.user.email }
    });

    return {
      ok: true,
      message: "Link gerado. Abrimos o WhatsApp — envie a mensagem ao cliente.",
      resetLink,
      whatsappUrl: `https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("SUPABASE_SERVICE_ROLE_KEY")) {
      return { error: "Configure SUPABASE_SERVICE_ROLE_KEY no servidor para gerar links de senha." };
    }
    console.error("[admin] adminRequestPasswordReset failed", error);
    return { error: "Não foi possível gerar o link de redefinição de senha." };
  }
}

export async function adminDeleteUser(userId: string): Promise<AdminActionState> {
  try {
    const session = await assertAdmin();
    if (session.user.id === userId) return { error: "Você não pode excluir a própria conta." };

    const detail = await adminRepository.getUserDetail(userId);
    if (!detail) return { error: "Cliente não encontrado." };
    if (detail.user.role === "platform_admin") {
      return { error: "Não é possível excluir uma conta de administrador." };
    }

    try {
      await adminRepository.deleteUserAccount(userId);
    } catch (error) {
      console.error("[admin] deleteUserAccount failed", error);
      return {
        error:
          "Não foi possível remover os dados do cliente. Rode a migration 016-user-delete-cascade.sql no Supabase e tente novamente."
      };
    }

    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const supabase = createSupabaseAdminClient();
        const { error } = await supabase.auth.admin.deleteUser(userId);
        if (error) {
          console.error("[admin] supabase.auth.admin.deleteUser failed", error);
          const notFound = /not found|404/i.test(error.message);
          if (!notFound) {
            return {
              error:
                "Dados do cliente removidos, mas o login no Supabase falhou. Exclua manualmente em Authentication → Users."
            };
          }
        }
      } catch (error) {
        console.error("[admin] supabase admin client failed", error);
        return {
          error:
            "Dados do cliente removidos, mas o login no Supabase não pôde ser excluído. Verifique SUPABASE_SERVICE_ROLE_KEY."
        };
      }
    }

    await repositories.audit.record({
      actorUserId: session.user.id,
      eventId: null,
      action: "admin.user_deleted",
      targetType: "user",
      targetId: userId,
      metadata: { email: detail.user.email }
    });
    revalidatePath("/admin/clientes");
    return { ok: true, message: "Conta excluída." };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao excluir conta.";
    if (message.includes("SUPABASE_SERVICE_ROLE_KEY")) {
      return { error: "Configure SUPABASE_SERVICE_ROLE_KEY no servidor para excluir contas." };
    }
    return { error: message };
  }
}

export async function adminUpdatePassword(_state: AdminActionState, formData: FormData): Promise<AdminActionState> {
  try {
    await assertAdmin();
    const currentPassword = String(formData.get("currentPassword") ?? "");
    const newPassword = String(formData.get("newPassword") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    if (newPassword.length < 8) return { error: "A nova senha precisa ter pelo menos 8 caracteres." };
    if (newPassword !== confirmPassword) return { error: "As senhas não coincidem." };

    const supabase = await createSupabaseServerClient();
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) return { error: "Sessão expirada. Entre novamente." };

    const email = authData.user.email;
    if (!email) return { error: "Email não encontrado na sessão." };

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password: currentPassword });
    if (signInError) return { error: "Senha atual incorreta." };

    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
    if (updateError) return { error: "Não foi possível atualizar a senha." };

    const user = await repositories.users.findById(authData.user.id);
    if (user) {
      const cookieStore = await cookies();
      const token = createSessionToken({
        userId: user.id,
        role: user.role,
        name: user.name,
        email: user.email,
        reauth: true
      });
      cookieStore.set(SESSION_COOKIE_NAME, token, buildSessionCookieOptions());
    }

    return { ok: true, message: "Senha atualizada com sucesso." };
  } catch {
    return { error: "Não foi possível atualizar a senha." };
  }
}

export async function adminUpdateEmail(_state: AdminActionState, formData: FormData): Promise<AdminActionState> {
  try {
    const session = await assertAdmin();
    const newEmail = String(formData.get("email") ?? "").trim().toLowerCase();
    const password = String(formData.get("password") ?? "");

    if (!newEmail.includes("@")) return { error: "Informe um email válido." };

    const supabase = await createSupabaseServerClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email: session.user.email, password });
    if (signInError) return { error: "Senha incorreta." };

    const { error: updateError } = await supabase.auth.updateUser({ email: newEmail });
    if (updateError) return { error: "Não foi possível atualizar o email. Ele pode já estar em uso." };

    return { ok: true, message: "Email atualizado. Confira sua caixa de entrada para confirmar." };
  } catch {
    return { error: "Não foi possível atualizar o email." };
  }
}
