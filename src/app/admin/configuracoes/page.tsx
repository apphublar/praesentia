import { AdminSettingsPanel } from "@/components/platform-admin/admin-settings-panel";
import { AdminMfaSetupPanel } from "@/components/auth/supabase-login-form";
import { getMfaEnrollmentStatus } from "@/app/login/actions";
import { requirePlatformAdmin } from "@/lib/auth/session";

export default async function AdminSettingsPage() {
  const session = await requirePlatformAdmin();
  const mfa = await getMfaEnrollmentStatus();

  return (
    <section className="platform-admin-section">
      <h2>Configurações</h2>
      <p className="platform-admin-lead">Gerencie e-mail, senha e autenticador do super admin.</p>
      <div className="platform-admin-settings">
        <AdminMfaSetupPanel enrolled={mfa.enrolled} />
        <AdminSettingsPanel user={session.user} />
      </div>
    </section>
  );
}
