import Link from "next/link";
import { AdminClientsPanel } from "@/components/platform-admin/admin-clients-panel";
import { adminRepository } from "@/lib/db";

function appBaseUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? "https://praesentia.com.br";
}

export default async function AdminClientsPage({
  searchParams
}: {
  searchParams?: Promise<{ q?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const search = params.q?.trim() ?? "";
  const { users, total } = await adminRepository.listUsers({ search, limit: 100 });

  return (
    <section className="platform-admin-section">
      <div className="platform-admin-section-head">
        <div>
          <h2>Clientes</h2>
          <p className="platform-admin-lead">{total} contas · bloquear, liberar cápsula, GB, tentativas IA, WhatsApp e links.</p>
        </div>
        <form className="platform-admin-search" action="/admin/clientes" method="get">
          <input type="search" name="q" placeholder="Buscar nome ou e-mail" defaultValue={search} />
          <button className="btn btn-dark" type="submit">Buscar</button>
          {search ? <Link href="/admin/clientes">Limpar</Link> : null}
        </form>
      </div>
      <AdminClientsPanel users={users} appBaseUrl={appBaseUrl()} />
    </section>
  );
}
