"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { repositories } from "@/lib/db";
import { createSessionToken, SESSION_COOKIE_NAME, sessionCookieOptions } from "@/lib/auth/session-cookie";
import { sanitizeText } from "@/lib/security/sanitize";
import { resolvePostLoginPath } from "@/lib/auth/post-login-path";

export type AuthActionState = {
  error?: string;
  notice?: string;
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

async function issuePraesentiaSession(userId: string, nextPath: string) {
  const user = await repositories.users.findById(userId);
  if (!user) {
    return {
      error: "Perfil ainda não está pronto. Aguarde alguns segundos e tente novamente."
    };
  }

  const cookieStore = await cookies();
  const token = createSessionToken({
    userId: user.id,
    role: user.role,
    name: user.name,
    email: user.email,
    reauth: true
  });
  cookieStore.set(SESSION_COOKIE_NAME, token, sessionCookieOptions);

  revalidatePath("/", "layout");
  redirect(nextPath);
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
  const nextPath = sanitizeRedirectPath(formData.get("next"), "/login/redefinir-senha");

  if (password.length < 8) {
    return { error: "Use uma senha com pelo menos 8 caracteres." };
  }

  const supabase = await createSupabaseServerClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user) {
    return { error: "Link expirado ou inválido. Solicite uma nova recuperação de senha." };
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return { error: "Não foi possível atualizar sua senha agora." };
  }

  return issuePraesentiaSession(authData.user.id, nextPath);
}

export async function loginWithSupabase(_state: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const email = sanitizeText(formData.get("email"), 180).toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || password.length < 6) {
    return { error: "Informe email e senha para entrar." };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user) {
    return { error: "Email ou senha inválidos." };
  }

  const nextPath = await resolveLoginDestination(formData.get("next"), data.user.id);
  return issuePraesentiaSession(data.user.id, nextPath);
}

export async function signUpWithSupabase(_state: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const name = sanitizeText(formData.get("name"), 120);
  const email = sanitizeText(formData.get("email"), 180).toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!name || !email || password.length < 8) {
    return { error: "Informe nome, email e uma senha com pelo menos 8 caracteres." };
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

  if (!data.session || !data.user) {
    return { notice: "Conta criada. Confira seu email para confirmar o acesso." };
  }

  const nextPath = await resolveLoginDestination(formNext, data.user.id);
  return issuePraesentiaSession(data.user.id, nextPath);
}
