import type { SupabaseClient } from "@supabase/supabase-js";

export async function getVerifiedTotpFactorId(supabase: SupabaseClient) {
  const { data, error } = await supabase.auth.mfa.listFactors();
  if (error) return null;
  const factor = data.totp.find((item) => item.status === "verified");
  return factor?.id ?? null;
}

export async function loginRequiresMfaVerification(supabase: SupabaseClient) {
  const { data: aal, error: aalError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aalError || !aal) return { required: false as const };

  if (aal.nextLevel !== "aal2" || aal.currentLevel === "aal2") {
    return { required: false as const };
  }

  const factorId = await getVerifiedTotpFactorId(supabase);
  if (!factorId) return { required: false as const };

  return { required: true as const, factorId };
}

export async function verifyTotpCode(supabase: SupabaseClient, factorId: string, code: string) {
  const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId });
  if (challengeError || !challenge) {
    return { ok: false as const, error: "Não foi possível iniciar a verificação do autenticador." };
  }

  const { error: verifyError } = await supabase.auth.mfa.verify({
    factorId,
    challengeId: challenge.id,
    code: code.trim()
  });

  if (verifyError) {
    return { ok: false as const, error: "Código do autenticador inválido ou expirado." };
  }

  return { ok: true as const };
}
