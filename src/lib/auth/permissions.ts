import type { Event, EventMember, MediaItem, User } from "@/types/domain";
import { isPlatformAdmin } from "@/lib/auth/session";

export function canViewEvent(user: User | null, event: Event, member?: EventMember) {
  if (event.visibility === "public") return true;
  if (!user || !member) return false;
  if (isPlatformAdmin(user)) return true;
  return member.accessStatus === "active";
}

export function canManageEvent(user: User, member?: EventMember) {
  if (isPlatformAdmin(user)) return true;
  return member?.accessStatus === "active" && ["owner", "manager"].includes(member.role);
}

export function canContribute(member?: EventMember) {
  return (
    member?.accessStatus === "active" &&
    member.rsvpStatus === "confirmed" &&
    ["owner", "manager", "guest"].includes(member.role)
  );
}

export function canLike(member?: EventMember) {
  return member?.accessStatus === "active" && member.rsvpStatus === "confirmed";
}

export function shouldDisplayMedia(item: MediaItem) {
  return item.status === "published";
}

export function shouldDisplayOnScreen(item: MediaItem) {
  return item.status === "published" && item.visibleOnScreen;
}
