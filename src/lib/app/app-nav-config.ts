import type { IconName } from "@/components/app/ui/icon";
import { CREATE_EVENT_PATH } from "@/lib/auth/routes";
import type { Event } from "@/types/domain";
import { hasCapsuleAccess } from "@/lib/plans/features";

export type AppNavGroup = {
  label: string;
  cap?: boolean;
  items: AppNavItem[];
};

export type AppNavItem = {
  id: string;
  href: string;
  name: string;
  icon: IconName;
  requiresEvent?: boolean;
  capsuleOnly?: boolean;
  externalPreview?: boolean;
};

export function buildAppNavGroups(event: Event | null): AppNavGroup[] {
  const slug = event?.slug;
  const eventId = event?.id;

  return [
    {
      label: "Organizador",
      items: [
        { id: "eventos", href: "/dashboard", name: "Meus eventos", icon: "grid" },
        { id: "criar", href: CREATE_EVENT_PATH, name: "Criar evento", icon: "plus" },
        {
          id: "admin",
          href: eventId ? `/dashboard/eventos/${eventId}` : "",
          name: "Painel do evento",
          icon: "gear",
          requiresEvent: true
        }
      ]
    },
    {
      label: "Convidado",
      items: [
        {
          id: "convite",
          href: slug ? `/evento/${slug}` : "",
          name: "Página do convite",
          icon: "eye",
          requiresEvent: true,
          externalPreview: true
        }
      ]
    },
    {
      label: "Durante a festa",
      cap: true,
      items: [
        {
          id: "mural",
          href: eventId ? `/dashboard/eventos/${eventId}/mural` : "",
          name: "Mural ao vivo",
          icon: "camera",
          requiresEvent: true,
          capsuleOnly: true
        },
        {
          id: "telao",
          href: eventId ? `/dashboard/eventos/${eventId}/telao` : "",
          name: "Telão",
          icon: "proj",
          requiresEvent: true,
          capsuleOnly: true
        }
      ]
    },
    {
      label: "Depois",
      cap: true,
      items: [
        {
          id: "capsula",
          href: eventId ? `/dashboard/eventos/${eventId}/capsula` : "",
          name: "Cápsula do tempo",
          icon: "hourglass",
          requiresEvent: true,
          capsuleOnly: true
        }
      ]
    },
    {
      label: "Conta",
      items: [
        { id: "pagamentos", href: "/dashboard/pagamentos", name: "Pagamentos", icon: "card" },
        { id: "site", href: "/", name: "Sair", icon: "home" },
        { id: "sair", href: "/api/auth/logout", name: "Sair da conta", icon: "logout" }
      ]
    }
  ];
}

export function isAppNavItemActive(item: AppNavItem, pathname: string, event: Event | null) {
  if (item.id === "eventos") return pathname === "/dashboard";
  if (item.id === "criar") return pathname.startsWith(CREATE_EVENT_PATH);
  if (item.id === "admin" && event) {
    return pathname === `/dashboard/eventos/${event.id}`;
  }
  if (item.id === "convite" && event) {
    return pathname === `/evento/${event.slug}` || pathname === `/evento/${event.freeCode}`;
  }
  if (item.id === "mural" && event) return pathname === `/dashboard/eventos/${event.id}/mural`;
  if (item.id === "telao" && event) return pathname === `/dashboard/eventos/${event.id}/telao`;
  if (item.id === "capsula" && event) return pathname === `/dashboard/eventos/${event.id}/capsula`;
  if (item.id === "pagamentos") return pathname === "/dashboard/pagamentos";
  if (item.id === "site") return false;
  if (item.id === "sair") return false;
  return false;
}

export function isAppNavItemLocked(item: AppNavItem, event: Event | null) {
  if (!item.capsuleOnly) return false;
  if (!event) return true;
  return !hasCapsuleAccess(event);
}

export function isAppNavItemDisabled(item: AppNavItem, event: Event | null) {
  return Boolean(item.requiresEvent && !event);
}
