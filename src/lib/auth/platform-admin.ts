export const PLATFORM_ADMIN_EMAIL = (
  process.env.PLATFORM_ADMIN_EMAIL ?? "adm.praesentia@gmail.com"
).trim().toLowerCase();

export function isPlatformAdminEmail(email: string) {
  return email.trim().toLowerCase() === PLATFORM_ADMIN_EMAIL;
}
