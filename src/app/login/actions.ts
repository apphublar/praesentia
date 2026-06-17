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
import { createPasswordRecoveryLink, createSignupAccount, sendPasswordResetEmail, sendSignupConfirmationEmail } from "@/lib/auth/auth-email";

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

function passwordResetErrorMessage(message: string) {
  const normalized = message.toLowerCase();
  if (normalized.includes("rate") || normalized.includes("seconds") || normalized.includes("too many")) {
    return "Aguarde um minuto antes de solicitar outro link.";
  }
  if (normalized.includes("redirect")) {
    return "Não foi possível enviar o link agora. Verifique a configuração de URLs no Supabase.";
  }
  if (normalized.includes("email") || normalized.includes("smtp") || normalized.includes("mail")) {
    return "Não foi possível enviar o email agora. Tente novamente em instantes.";
  }
  return "Não foi possível enviar o link agora. Tente novamente em instantes.";
}

export async function requestPasswordReset(_state: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const email = sanitizeText(formData.get("email"), 180).toLowerCase();

  if (!email) {
    return { error: "Informe seu email para recuperar a senha." };
  }

  const linkResult = await createPasswordRecoveryLink(email);
  if (!linkResult.ok) {
    console.error("[auth] createPasswordRecoveryLink failed", linkResult.error);
    return { error: passwordResetErrorMessage(linkResult.error) };
  }

  if (linkResult.unknownUser) {
    return {
      notice: "Se este email estiver cadastrado, você receberá um link para redefinir sua senha."
    };
  }

  const sendResult = await sendPasswordResetEmail({ to: email, resetLink: linkResult.resetLink });
  if (!sendResult.ok) {
    console.error("[auth] sendPasswordResetEmail failed", sendResult.error);
    return { error: "Não foi possível enviar o email agora. Tente novamente em instantes." };
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

  const emailRedirectPath = sanitizeRedirectPath(formData.get("next"), "/dashboard/criar");
  const signupResult = await createSignupAccount({
    email,
    password,
    name,
    nextPath: emailRedirectPath
  });

  if (!signupResult.ok) {
    if (signupResult.error === "exists") {
      return { error: "Este email já possui uma conta. Faça login ou recupere sua senha." };
    }
    console.error("[auth] createSignupAccount failed", signupResult.error);
    return { error: "Não foi possível criar sua conta agora." };
  }

  const sendResult = await sendSignupConfirmationEmail({
    to: email,
    name,
    confirmLink: signupResult.confirmLink
  });

  if (!sendResult.ok) {
    console.error("[auth] sendSignupConfirmationEmail failed", sendResult.error);
    return {
      error: "Conta criada, mas não foi possível enviar o email de confirmação. Tente entrar ou recupere sua senha."
    };
  }

  return { notice: "Conta criada. Confira seu email para confirmar o acesso." };
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
