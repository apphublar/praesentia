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

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function brandedAuthEmail(input: {
  preheader: string;
  title: string;
  intro: string;
  buttonLabel: string;
  href: string;
  footerNote: string;
}) {
  const safeHref = escapeHtml(input.href);
  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(input.title)}</title>
  </head>
  <body style="margin:0;background:#f8efe2;color:#21160f;font-family:Arial,Helvetica,sans-serif;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(input.preheader)}</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f8efe2;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#fffaf2;border:1px solid #ead8c6;border-radius:18px;overflow:hidden;">
            <tr>
              <td style="padding:24px 28px 14px;border-bottom:1px solid #ead8c6;">
                <div style="font-size:12px;letter-spacing:3px;text-transform:uppercase;color:#b66a52;">Praesentia</div>
                <div style="font-size:28px;font-weight:800;line-height:1.1;margin-top:6px;">Memórias vivas, guardadas com carinho.</div>
              </td>
            </tr>
            <tr>
              <td style="padding:28px;">
                <h1 style="font-size:24px;line-height:1.2;margin:0 0 12px;">${escapeHtml(input.title)}</h1>
                <p style="font-size:16px;line-height:1.6;margin:0 0 24px;color:#5f5147;">${escapeHtml(input.intro)}</p>
                <a href="${safeHref}" style="display:inline-block;background:#21160f;color:#fffaf2;text-decoration:none;border-radius:999px;padding:14px 22px;font-size:14px;font-weight:700;">${escapeHtml(input.buttonLabel)}</a>
                <p style="font-size:13px;line-height:1.6;margin:24px 0 8px;color:#7c6b5d;">Se o botão não funcionar, copie e cole este link no navegador:</p>
                <p style="font-size:12px;line-height:1.5;margin:0;word-break:break-all;color:#3b2a21;">${safeHref}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:18px 28px;background:#f3e5d2;color:#7c6b5d;font-size:12px;line-height:1.5;">
                ${escapeHtml(input.footerNote)}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
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
    subject: "Redefinir sua senha | Praesentia",
    html: brandedAuthEmail({
      preheader: "Crie uma nova senha para acessar sua conta Praesentia.",
      title: "Redefina sua senha",
      intro: "Recebemos um pedido para redefinir a senha da sua conta Praesentia. Use o botão abaixo para criar uma nova senha.",
      buttonLabel: "Criar nova senha",
      href: input.resetLink,
      footerNote: `Depois de salvar a nova senha, entre em ${loginUrl}. Se você não solicitou esta alteração, ignore este email.`
    })
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
    subject: "Confirme sua conta | Praesentia",
    html: brandedAuthEmail({
      preheader: "Confirme seu email para começar a criar convites e eventos.",
      title: "Confirme sua conta",
      intro: `Olá, ${input.name}! Bem-vindo(a) ao Praesentia. Confirme seu email para começar a criar convites, acompanhar confirmações e guardar as memórias do seu evento.`,
      buttonLabel: "Confirmar minha conta",
      href: input.confirmLink,
      footerNote: `Depois de confirmar, entre em ${loginUrl}. Se você não criou uma conta no Praesentia, ignore este email.`
    })
  });
}
