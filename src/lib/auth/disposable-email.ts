const DISPOSABLE_EMAIL_DOMAINS = new Set(
  [
    "10minutemail.com",
    "10minutemail.net",
    "1secmail.com",
    "1secmail.net",
    "1secmail.org",
    "aratrin.com",
    "aspensif.com",
    "bmoar.com",
    "burnermail.io",
    "discard.email",
    "disposablemail.com",
    "dropmail.me",
    "emailondeck.com",
    "fakeinbox.com",
    "getairmail.com",
    "getnada.com",
    "guerrillamail.com",
    "guerrillamail.net",
    "guerrillamail.org",
    "guerrillamailblock.com",
    "harakirimail.com",
    "inboxkitten.com",
    "maildrop.cc",
    "mailinator.com",
    "mailinator.net",
    "mailinator.org",
    "mailnesia.com",
    "mailpoof.com",
    "mailtemp.net",
    "mintemail.com",
    "moakt.com",
    "mytemp.email",
    "sharklasers.com",
    "spam4.me",
    "temp-mail.org",
    "tempail.com",
    "tempmail.com",
    "tempmail.net",
    "tempmailo.com",
    "tempmailaddress.com",
    "throwaway.email",
    "trashmail.com",
    "trashmail.net",
    "trashmail.org",
    "yopmail.com",
    "yopmail.fr",
    "yopmail.net"
  ].map((domain) => domain.toLowerCase())
);

export function extractEmailDomain(email: string) {
  const at = email.lastIndexOf("@");
  if (at <= 0 || at === email.length - 1) return null;
  return email.slice(at + 1).trim().toLowerCase();
}

export function isDisposableEmail(email: string) {
  const domain = extractEmailDomain(email);
  if (!domain) return false;
  return DISPOSABLE_EMAIL_DOMAINS.has(domain);
}

export function disposableEmailErrorMessage() {
  return "Use um email permanente. Endereços temporários ou descartáveis não são aceitos.";
}
