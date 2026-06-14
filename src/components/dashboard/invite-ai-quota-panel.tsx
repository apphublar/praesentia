import type { CoverQuota } from "@/components/dashboard/cover-generator";
import { Mono } from "@/components/app/ui/primitives";

export function InviteAiQuotaPanel({ quota, eventUsed }: { quota: CoverQuota; eventUsed: number }) {
  if (quota.testingMode) return null;

  let title = "Versões de convite IA";
  let lines: string[] = [];

  if (quota.familyPoolTotal) {
    title = "Versões IA · Cápsula Plus";
    lines = [
      `${quota.familyPoolUsed ?? 0} de ${quota.familyPoolTotal} versões usadas no ano`,
      `Neste evento: ${eventUsed} de ${quota.familyPerEventMax ?? 2}`,
      "Distribua com cuidado — o total é compartilhado entre até 6 eventos."
    ];
  } else if (quota.accountPoolRemaining != null && quota.accountPoolRemaining >= 0 && quota.invitePoolPlan) {
    title = "Versões IA · pacote ativo";
    lines = [
      `${quota.accountPoolRemaining} versões restantes na conta`,
      `Neste evento: ${eventUsed} de ${quota.perEventMax ?? 3}`,
      "Até 3 tentativas criativas por evento."
    ];
  } else if (quota.freePlan) {
    title = "Versões IA · plano gratuito";
    lines = [
      quota.canGenerate ? "1 versão gratuita disponível nesta conta" : "Versão gratuita já utilizada nesta conta",
      "Novas tentativas criativas exigem pacote Inspiração ou Criativo."
    ];
  } else if (quota.perEventMax && quota.perEventMax > 1) {
    lines = [
      `${quota.remainingGenerations} tentativa${quota.remainingGenerations === 1 ? "" : "s"} restante${quota.remainingGenerations === 1 ? "" : "s"} neste evento`,
      `Até ${quota.perEventMax} versões por evento · escolha a favorita para compartilhar.`
    ];
  } else {
    return null;
  }

  return (
    <div className="card" style={{ padding: 18 }}>
      <Mono style={{ display: "block", marginBottom: 10 }}>{title}</Mono>
      {lines.map((line) => (
        <p key={line} style={{ margin: "0 0 8px", fontSize: 12.5, color: "var(--muted)", lineHeight: 1.45 }}>
          {line}
        </p>
      ))}
    </div>
  );
}
