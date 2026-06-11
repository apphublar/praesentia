export function FundraisingProgress({
  goalAmount,
  collectedAmount
}: {
  goalAmount?: number;
  collectedAmount: number;
}) {
  if (!goalAmount || goalAmount <= 0) return null;

  const percent = Math.min(100, Math.round((collectedAmount / goalAmount) * 100));

  return (
    <div className="public-fundraising-progress">
      <div className="public-fundraising-progress-head">
        <span>Arrecadado</span>
        <strong>
          R$ {collectedAmount.toLocaleString("pt-BR")} de R$ {goalAmount.toLocaleString("pt-BR")}
        </strong>
      </div>
      <div className="public-fundraising-progress-bar" aria-hidden="true">
        <span style={{ width: `${percent}%` }} />
      </div>
      <p className="public-event-message">{percent}% da meta com base nas confirmações informadas.</p>
    </div>
  );
}
