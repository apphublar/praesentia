"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AccountActionsPanel() {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout() {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" });
      router.replace("/login");
    } finally {
      setIsLoggingOut(false);
    }
  }

  return (
    <button className="btn btn-secondary btn-sm" type="button" onClick={handleLogout} disabled={isLoggingOut}>
      {isLoggingOut ? "Saindo..." : "Sair da conta"}
    </button>
  );
}
