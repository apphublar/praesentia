import { PLATFORM_ADMIN_EMAIL, isPlatformAdminEmail } from "@/lib/auth/platform-admin";
import { getSql } from "@/lib/db/client";

/** Garante que só o e-mail autorizado seja platform_admin no banco. */
export async function syncPlatformAdminRole(userId: string, email: string) {
  if (!process.env.DATABASE_URL) return;

  const sql = getSql();
  const shouldBeAdmin = isPlatformAdminEmail(email);

  if (shouldBeAdmin) {
    await sql`
      update users set role = 'platform_admin', updated_at = now()
      where id = ${userId}
    `;
    await sql`
      update users set role = 'user', updated_at = now()
      where role = 'platform_admin' and lower(email) <> ${PLATFORM_ADMIN_EMAIL}
    `;
    return;
  }

  await sql`
    update users set role = 'user', updated_at = now()
    where id = ${userId} and role = 'platform_admin'
  `;
}
