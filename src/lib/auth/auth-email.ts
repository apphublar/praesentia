import { getAppBaseUrl, getAuthCallbackUrl, getAuthRecoveryCallbackUrl } from "@/lib/app-url";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

function authFromEmail() {
  return (
    process.env.RESEND_FROM_EMAIL ||
    process.env.MURAL_EMAIL_FROM ||
    "Praesentia <noreply@praesentia.com.br>"
  );
}

function isUnknownUserError(message: string) {
  const normalized = message.toLowerCase();
  return normalized.includes("not found") || normalized.includes("no user") || normalized.includes("user not");
}

function isExistingUserError(message: string) {
  const normalized = message.toLowerCase();
  return normalized.includes("already") || normalized.includes("registered") || normalized.includes("exists");
}

async function sendAuthEmail(input: { to: string; subject: string; html: string }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("[auth-email] RESEND_API_KEY ausente");
    return { ok: false as const, error: "missing_api_key" };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: authFromEmail(),
      to: [input.to],
      subject: input.subject,
      html: input.html
    })
  });

  if (!response.ok) {
    const detail = await response.text();
    console.error("[auth-email] falha ao enviar email", detail);
    return { ok: false as const, error: detail };
  }

  return { ok: true as const };
}

export async function createPasswordRecoveryLink(email: string) {
  const supabase = createSupabaseAdminClient();
  const redirectTo = getAuthRecoveryCallbackUrl();
  const { data, error } = await supabase.auth.admin.generateLink({
    type: "recovery",
    email,
    options: { redirectTo }
  });

  if (error) {
    if (isUnknownUserError(error.message)) {
      return { ok: true as const, unknownUser: true as const };
    }
    return { ok: false as const, error: error.message };
  }

  const resetLink = data?.properties?.action_link;
  if (!resetLink) {
    return { ok: false as const, error: "Link de recuperação indisponível." };
  }

  return { ok: true as const, unknownUser: false as const, resetLink };
}

export async function sendPasswordResetEmail(input: { to: string; resetLink: string }) {
  const loginUrl = `${getAppBaseUrl()}/login`;
  return sendAuthEmail({
    to: input.to,
    subject: "Redefinir sua senha — Praesentia",
    html: `
      <p>Olá!</p>
      <p>Recebemos um pedido para redefinir a senha da sua conta Praesentia.</p>
      <p><a href="${input.resetLink}">Clique aqui para criar uma nova senha</a></p>
      <p>Se o botão não funcionar, copie e cole este link no navegador:</p>
      <p>${input.resetLink}</p>
      <p>Depois de salvar a nova senha, entre em <a href="${loginUrl}">${loginUrl}</a>.</p>
      <p>Se você não solicitou esta alteração, ignore este email.</p>
    `
  });
}

export async function createSignupAccount(input: {
  email: string;
  password: string;
  name: string;
  nextPath: string;
}) {
  const supabase = createSupabaseAdminClient();
  const redirectTo = getAuthCallbackUrl(input.nextPath);
  const { data, error } = await supabase.auth.admin.generateLink({
    type: "signup",
    email: input.email,
    password: input.password,
    options: {
      data: { name: input.name },
      redirectTo
    }
  });

  if (error) {
    if (isExistingUserError(error.message)) {
      return { ok: false as const, error: "exists" as const };
    }
    return { ok: false as const, error: error.message };
  }

  const confirmLink = data?.properties?.action_link;
  if (!confirmLink) {
    return { ok: false as const, error: "Link de confirmação indisponível." };
  }

  return { ok: true as const, confirmLink };
}

export async function sendSignupConfirmationEmail(input: { to: string; name: string; confirmLink: string }) {
  const loginUrl = `${getAppBaseUrl()}/login`;
  return sendAuthEmail({
    to: input.to,
    subject: "Confirme sua conta — Praesentia",
    html: `
      <p>Olá, ${input.name}!</p>
      <p>Bem-vindo(a) ao Praesentia. Confirme seu email para começar a criar convites e eventos.</p>
      <p><a href="${input.confirmLink}">Clique aqui para confirmar sua conta</a></p>
      <p>Se o botão não funcionar, copie e cole este link no navegador:</p>
      <p>${input.confirmLink}</p>
      <p>Depois de confirmar, entre em <a href="${loginUrl}">${loginUrl}</a>.</p>
    `
  });
}
