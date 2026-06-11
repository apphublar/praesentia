export async function sendMuralAccessCodeEmail(input: {
  to: string;
  guestName: string;
  eventTitle: string;
  code: string;
  isMemory?: boolean;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.MURAL_EMAIL_FROM || "Praesentia <noreply@praesentia.com.br>";
  const contextLabel = input.isMemory ? "cápsula do tempo" : "mural ao vivo";

  if (!apiKey) {
    console.info("[mural-email] código de acesso", {
      to: input.to,
      event: input.eventTitle,
      code: input.code,
      context: contextLabel
    });
    return { delivered: false, logged: true };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from,
      to: [input.to],
      subject: `Seu código de acesso — ${input.eventTitle}`,
      html: `
        <p>Olá, ${input.guestName}!</p>
        <p>Seu código de acesso à ${contextLabel} de <strong>${input.eventTitle}</strong> é:</p>
        <p style="font-size:28px;font-weight:700;letter-spacing:4px">${input.code}</p>
        <p>Use este código junto com o e-mail informado na confirmação de presença.</p>
      `
    })
  });

  if (!response.ok) {
    const detail = await response.text();
    console.error("[mural-email] falha ao enviar", detail);
    return { delivered: false, logged: false };
  }

  return { delivered: true, logged: false };
}
