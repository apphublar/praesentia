"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loginRequiresMfaVerification, verifyTotpCode } from "@/lib/auth/mfa";
import { disposableEmailErrorMessage, isDisposableEmail } from "@/lib/auth/disposable-email";
import { sanitizeText } from "@/lib/security/sanitize";
import { resolvePostLoginPath } from "@/lib/auth/post-login-path";
import { SESSION_COOKIE_NAME } from "@/lib/auth/session-cookie";

export type AuthActionState = {
  error?: string;
  notice?: string;
  requiresMfa?: boolean;
  factorId?: string;
  pendingNext?: string;
  mfaQrCode?: string;
  mfaFactorId?: string;
};

function sanitizeRedirectPath(value: FormDataEntryValue | null, fallback: string) {
  const next = typeof value === "string" ? value : "";
  if (!next.startsWith("/") || next.startsWith("//")) return fallback;
  return next;
}

async function resolveLoginDestination(formNext: FormDataEntryValue | null, userId: string) {
  const requested = typeof formNext === "string" ? formNext : null;
  return resolvePostLoginPath(userId, requested);
}

/** Cookie é gravado na resposta HTTP de redirect (mesmo fluxo do OAuth callback). */
function issuePraesentiaSession(_userId: string, _email: string, nextPath: string): never {
  redirect(`/api/auth/establish-session?next=${encodeURIComponent(nextPath)}`);
}

function appBaseUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

function isExistingAccountSignup(data: { user: { identities?: { id: string }[] } | null }) {
  return Boolean(data.user && (!data.user.identities || data.user.identities.length === 0));
}

export async function requestPasswordReset(_state: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const email = sanitizeText(formData.get("email"), 180).toLowerCase();

  if (!email) {
    return { error: "Informe seu email para recuperar a senha." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${appBaseUrl()}/auth/callback?next=${encodeURIComponent("/login/redefinir-senha")}`
  });

  if (error) {
    return { error: "Não foi possível enviar o link agora. Tente novamente em instantes." };
  }

  return {
    notice: "Se este email estiver cadastrado, você receberá um link para redefinir sua senha."
  };
}

export async function updatePasswordAfterRecovery(_state: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (password.length < 8) {
    return { error: "Use uma senha com pelo menos 8 caracteres." };
  }

  if (password !== confirmPassword) {
    return { error: "As senhas não coincidem." };
  }

  const supabase = await createSupabaseServerClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user?.email) {
    return { error: "Link expirado ou inválido. Peça um novo link à equipe Praesentia." };
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return { error: "Não foi possível atualizar sua senha agora." };
  }

  await supabase.auth.signOut();
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
  revalidatePath("/", "layout");

  redirect("/login?notice=password-updated");
}

export async function loginWithSupabase(_state: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const email = sanitizeText(formData.get("email"), 180).toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || password.length < 6) {
    return { error: "Informe email e senha para entrar." };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user?.email) {
    return { error: "Email ou senha inválidos." };
  }

  const nextPath = await resolveLoginDestination(formData.get("next"), data.user.id);
  const mfa = await loginRequiresMfaVerification(supabase);

  if (mfa.required) {
    return {
      requiresMfa: true,
      factorId: mfa.factorId,
      pendingNext: nextPath,
      notice: "Digite o código de 6 dígitos do Google Authenticator."
    };
  }

  return issuePraesentiaSession(data.user.id, data.user.email, nextPath);
}

export async function verifyLoginMfa(_state: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const code = String(formData.get("code") ?? "").trim();
  const factorId = String(formData.get("factorId") ?? "");
  const nextPath = sanitizeRedirectPath(formData.get("next"), "/dashboard");

  if (!code || code.length < 6 || !factorId) {
    return { error: "Informe o código de 6 dígitos do autenticador." };
  }

  const supabase = await createSupabaseServerClient();
  const verified = await verifyTotpCode(supabase, factorId, code);
  if (!verified.ok) {
    return {
      error: verified.error,
      requiresMfa: true,
      factorId,
      pendingNext: nextPath
    };
  }

  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user?.email) {
    return { error: "Sessão expirada. Entre novamente com email e senha." };
  }

  return issuePraesentiaSession(authData.user.id, authData.user.email, nextPath);
}

export async function signUpWithSupabase(_state: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const name = sanitizeText(formData.get("name"), 120);
  const email = sanitizeText(formData.get("email"), 180).toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!name || !email || password.length < 8) {
    return { error: "Informe nome, email e uma senha com pelo menos 8 caracteres." };
  }

  if (isDisposableEmail(email)) {
    return { error: disposableEmailErrorMessage() };
  }

  const formNext = formData.get("next");
  const emailRedirectPath = sanitizeRedirectPath(formNext, "/dashboard/criar");

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name },
      emailRedirectTo: `${appBaseUrl()}/auth/callback?next=${encodeURIComponent(emailRedirectPath)}`
    }
  });

  if (error) {
    const message = error.message.toLowerCase();
    if (message.includes("already") || message.includes("registered") || message.includes("exists")) {
      return { error: "Este email já possui uma conta. Faça login ou recupere sua senha." };
    }
    return { error: "Não foi possível criar sua conta agora." };
  }

  if (isExistingAccountSignup(data)) {
    return { error: "Este email já possui uma conta. Faça login ou recupere sua senha." };
  }

  if (!data.session || !data.user?.email) {
    return { notice: "Conta criada. Confira seu email para confirmar o acesso." };
  }

  const nextPath = await resolveLoginDestination(formNext, data.user.id);
  return issuePraesentiaSession(data.user.id, data.user.email, nextPath);
}

export async function startMfaEnrollment(): Promise<AuthActionState> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: "totp",
    friendlyName: "Google Authenticator"
  });

  if (error || !data?.id || !data.totp?.qr_code) {
    return { error: "Não foi possível iniciar a configuração do autenticador." };
  }

  return {
    notice: "Escaneie o QR Code no Google Authenticator e confirme com um código.",
    mfaFactorId: data.id,
    mfaQrCode: data.totp.qr_code
  };
}

export async function confirmMfaEnrollment(_state: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const factorId = String(formData.get("factorId") ?? "");
  const code = String(formData.get("code") ?? "").trim();

  if (!factorId || code.length < 6) {
    return { error: "Informe o código de 6 dígitos." };
  }

  const supabase = await createSupabaseServerClient();
  const verified = await verifyTotpCode(supabase, factorId, code);
  if (!verified.ok) return { error: verified.error };

  revalidatePath("/admin/configuracoes");
  return { notice: "Autenticador configurado com sucesso. Use o código ao entrar." };
}

export async function getMfaEnrollmentStatus(): Promise<{ enrolled: boolean; factorId?: string }> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.mfa.listFactors();
  if (error) return { enrolled: false };
  const factor = data.totp.find((item) => item.status === "verified");
  return { enrolled: Boolean(factor), factorId: factor?.id };
}
