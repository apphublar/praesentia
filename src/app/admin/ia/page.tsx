import { unstable_cache } from "next/cache";
import { ADMIN_EXTERNAL_LINKS, formatUsd } from "@/lib/admin/constants";
import { adminRepository } from "@/lib/db";

const getAdminAiPageDataCached = unstable_cache(
  async () =>
    Promise.all([
      adminRepository.getMetrics(),
      adminRepository.listAiUsage({ limit: 150 })
    ]),
  ["admin-ai-page-data"],
  { revalidate: 20 }
);

export default async function AdminAiPage() {
  const [metrics, usage] = await getAdminAiPageDataCached();

  const totalUsageCost = usage.rows.reduce((sum, row) => sum + row.estimatedCostUsd, 0);

  return (
    <section className="platform-admin-section">
      <div className="platform-admin-section-head">
        <div>
          <h2>Inteligência artificial</h2>
          <p className="platform-admin-lead">
            Gerações de capa: {metrics.aiCoverGenerations} · Edições: {metrics.aiCoverEdits} · Textos: {metrics.aiTextGenerations}
          </p>
        </div>
        <div className="platform-admin-link-row">
          <a className="btn btn-dark" href={ADMIN_EXTERNAL_LINKS.openAiUsage} target="_blank" rel="noreferrer">Abrir painel OpenAI</a>
          <a className="btn btn-secondary" href={ADMIN_EXTERNAL_LINKS.openAiApiKeys} target="_blank" rel="noreferrer">Chaves API</a>
        </div>
      </div>

      <div className="platform-admin-metrics platform-admin-metrics-compact">
        <article className="platform-admin-stat">
          <p className="platform-admin-stat-label">Custo estimado total</p>
          <strong style={{ color: "#2563eb" }}>{formatUsd(metrics.estimatedAiCostUsd)}</strong>
        </article>
        <article className="platform-admin-stat">
          <p className="platform-admin-stat-label">Artefatos concluídos</p>
          <strong>{metrics.aiArtifactsCompleted}</strong>
        </article>
        <article className="platform-admin-stat">
          <p className="platform-admin-stat-label">Estornadas / falhas</p>
          <strong>{metrics.aiArtifactsRefunded}</strong>
        </article>
        <article className="platform-admin-stat">
          <p className="platform-admin-stat-label">Custo na lista abaixo</p>
          <strong>{formatUsd(totalUsageCost)}</strong>
        </article>
      </div>

      <div className="platform-admin-table-wrap card">
        <table className="platform-admin-table">
          <thead>
            <tr>
              <th>Data</th>
              <th>Cliente</th>
              <th>Evento</th>
              <th>Tipo</th>
              <th>Status</th>
              <th>Modelo</th>
              <th>Custo est.</th>
            </tr>
          </thead>
          <tbody>
            {usage.rows.map((row) => (
              <tr key={row.id}>
                <td>{new Date(row.createdAt).toLocaleString("pt-BR")}</td>
                <td>{row.userName}</td>
                <td>{row.eventTitle}</td>
                <td>{row.usageType === "generation" ? "Geração" : "Edição"}</td>
                <td>{row.status}</td>
                <td>{row.model ?? "—"}</td>
                <td>{formatUsd(row.estimatedCostUsd)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
