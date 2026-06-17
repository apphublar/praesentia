"use client";

import { Icon } from "@/components/app/ui/icon";

export function InviteArtApprovalModal({
  open,
  coverUrl,
  onApprove,
  onGenerateNew,
  onClose
}: {
  open: boolean;
  coverUrl: string;
  onApprove: () => void;
  onGenerateNew: () => void;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div className="invite-art-approval-backdrop" role="dialog" aria-modal="true" aria-labelledby="invite-art-approval-title">
      <div className="invite-art-approval-modal">
        <button type="button" className="invite-art-approval-close" onClick={onClose} aria-label="Fechar">
          <Icon name="x" size={18} />
        </button>
        <h2 id="invite-art-approval-title" className="serif-i" style={{ fontSize: 24, margin: "0 0 8px" }}>
          Sua arte ficou pronta
        </h2>
        <p style={{ margin: "0 0 16px", fontSize: 13.5, color: "var(--muted)", lineHeight: 1.5 }}>
          Confira o convite gerado. Se gostar, aprove para continuar. Se quiser outra versão, gere uma nova.
        </p>
        <div className="invite-art-approval-preview">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={coverUrl} alt="Convite gerado" />
        </div>
        <div className="invite-art-approval-actions">
          <button type="button" className="btn btn-coral" onClick={onApprove}>
            Aprovar arte
          </button>
          <button type="button" className="btn btn-dark" onClick={onGenerateNew}>
            Gerar nova
          </button>
        </div>
      </div>
    </div>
  );
}
