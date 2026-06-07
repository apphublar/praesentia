import type { MediaItem } from "@/types/domain";
import { emitRealtimeEvent } from "@/lib/realtime/bus";

export type RealtimeEvent =
  | { type: "media.created"; eventId: string; item: MediaItem }
  | { type: "media.updated"; eventId: string; item: MediaItem }
  | { type: "like.changed"; eventId: string; mediaId: string; likesCount: number }
  | { type: "screen.changed"; eventId: string };

export async function publishRealtimeEvent(event: RealtimeEvent) {
  // Placeholder for Pusher, Ably, Supabase Realtime, or a WebSocket server.
  // Keeping this seam explicit prevents UI code from depending on one vendor.
  if (process.env.REALTIME_PROVIDER === "mock") {
    console.info("[realtime:mock]", event.type, event.eventId);
  }
  emitRealtimeEvent(event);
}
