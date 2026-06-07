import type { EventMember, MediaItem } from "@/types/domain";

export function archiveMediaByUser(items: MediaItem[], userId: string) {
  return items.map((item) =>
    item.userId === userId && item.status === "published"
      ? { ...item, status: "archived" as const, visibleOnScreen: false }
      : item
  );
}

export function blockMember(member: EventMember) {
  return {
    ...member,
    accessStatus: "blocked" as const
  };
}

export function restoreMember(member: EventMember) {
  return {
    ...member,
    accessStatus: "active" as const
  };
}
