"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function DashboardHashScroll() {
  const pathname = usePathname();

  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    if (!hash) return;

    const scrollToSection = () => {
      document.getElementById(hash)?.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    scrollToSection();
    const timer = window.setTimeout(scrollToSection, 180);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  return null;
}
