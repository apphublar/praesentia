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
          href: slug ? `/evento/${slug}/mural` : "",
          name: "Mural ao vivo",
          icon: "camera",
          requiresEvent: true,
          capsuleOnly: true,
          externalPreview: true
        },
        {
          id: "telao",
          href: slug ? `/evento/${slug}/telao` : "",
          name: "Telão",
          icon: "proj",
          requiresEvent: true,
          capsuleOnly: true,
          externalPreview: true
        }
      ]
    },
    {
      label: "Depois",
      cap: true,
      items: [
        {
          id: "capsula",
          href: slug ? `/evento/${slug}/capsula` : "",
          name: "Cápsula do tempo",
          icon: "hourglass",
          requiresEvent: true,
          capsuleOnly: true,
          externalPreview: true
        }
      ]
    }
  ];
}

export function isAppNavItemActive(item: AppNavItem, pathname: string, event: Event | null) {
  if (item.id === "eventos") return pathname === "/dashboard";
  if (item.id === "criar") return pathname.startsWith(CREATE_EVENT_PATH);
  if (item.id === "admin" && event) return pathname.startsWith(`/dashboard/eventos/${event.id}`);
  if (item.id === "convite" && event) {
    return pathname === `/evento/${event.slug}` || pathname === `/evento/${event.freeCode}`;
  }
  if (item.id === "mural" && event) return pathname.startsWith(`/evento/${event.slug}/mural`);
  if (item.id === "telao" && event) return pathname.startsWith(`/evento/${event.slug}/telao`);
  if (item.id === "capsula" && event) return pathname.startsWith(`/evento/${event.slug}/capsula`);
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
