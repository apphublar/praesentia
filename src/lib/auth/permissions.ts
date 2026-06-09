import type { Event, EventMember, MediaItem, User } from "@/types/domain";
import { isPlatformAdmin } from "@/lib/auth/session";
import { isWithinGuestDeleteWindow } from "@/lib/events/phase";
import { canAccessCapsule, canAccessMural, hasCapsuleAccess } from "@/lib/plans/features";

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

export function canUploadVideo(user: User, member?: EventMember) {
  return canManageEvent(user, member);
}

export function canContribute(event: Event, member?: EventMember) {
  if (!canAccessMural(event)) return false;
  return (
    member?.accessStatus === "active" &&
    member.rsvpStatus === "confirmed" &&
    ["owner", "manager", "guest"].includes(member.role)
  );
}

export function canLike(event: Event, member?: EventMember) {
  if (!canAccessMural(event)) return false;
  return member?.accessStatus === "active" && member.rsvpStatus === "confirmed";
}

export function canViewCapsuleMemories(event: Event, member?: EventMember) {
  if (!canAccessCapsule(event)) return false;
  if (!member || member.accessStatus !== "active") return false;
  return member.rsvpStatus === "confirmed" || ["owner", "manager"].includes(member.role);
}

export function canDeleteMedia(
  event: Event,
  user: User,
  member: EventMember | undefined,
  media: MediaItem,
  now = new Date()
) {
  if (canManageEvent(user, member)) return true;
  if (!hasCapsuleAccess(event)) return false;
  if (media.userId !== user.id) return false;
  if (!member || member.rsvpStatus !== "confirmed" || member.accessStatus !== "active") return false;
  return isWithinGuestDeleteWindow(event, now);
}

export function shouldDisplayMedia(item: MediaItem) {
  return item.status === "published";
}

export function shouldDisplayOnScreen(item: MediaItem) {
  return item.status === "published" && item.visibleOnScreen;
}
