"use server";

import { revalidatePath } from "next/cache";
import { adminRepository, repositories } from "@/lib/db";
import { requirePlatformAdmin } from "@/lib/auth/session";
import {
  fulfillAiInvitePlan,
  fulfillCapsulePurchase,
  fulfillStoragePurchase
} from "@/lib/billing/fulfill-checkout";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { AiInviteUpgradePlan } from "@/lib/plans/ai-invite-plans";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSessionToken, SESSION_COOKIE_NAME, sessionCookieOptions } from "@/lib/auth/session-cookie";
import { cookies } from "next/headers";

export type AdminActionState = {
  ok?: boolean;
  error?: string;
  message?: string;
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

export async function adminActivateCapsule(eventId: string, userId: string): Promise<AdminActionState> {
  try {
    const session = await assertAdmin();
    await fulfillCapsulePurchase(eventId, userId, "capsule");
    await repositories.audit.record({
      actorUserId: session.user.id,
      eventId,
      action: "admin.capsule_granted",
      targetType: "event",
      targetId: eventId,
      metadata: { grantedTo: userId, priceBrl: 0, priceLabel: "Cortesia admin" }
    });
    revalidatePath("/admin/clientes");
    return { ok: true, message: "Cápsula liberada para o evento." };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Falha ao liberar cápsula." };
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

export async function adminDeleteUser(userId: string): Promise<AdminActionState> {
  try {
    const session = await assertAdmin();
    if (session.user.id === userId) return { error: "Você não pode excluir a própria conta." };

    const supabase = createSupabaseAdminClient();
    const { error } = await supabase.auth.admin.deleteUser(userId);
    if (error) return { error: "Não foi possível excluir a conta no Supabase." };

    await repositories.audit.record({
      actorUserId: session.user.id,
      eventId: null,
      action: "admin.user_deleted",
      targetType: "user",
      targetId: userId,
      metadata: {}
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
      cookieStore.set(SESSION_COOKIE_NAME, token, sessionCookieOptions);
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
