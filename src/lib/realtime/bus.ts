import { EventEmitter } from "node:events";
import type { RealtimeEvent } from "@/lib/realtime/events";

const globalForRealtime = globalThis as typeof globalThis & {
  __praesentiaRealtimeBus?: EventEmitter;
};

export const realtimeBus = globalForRealtime.__praesentiaRealtimeBus ?? new EventEmitter();
globalForRealtime.__praesentiaRealtimeBus = realtimeBus;

export function emitRealtimeEvent(event: RealtimeEvent) {
  realtimeBus.emit(event.eventId, event);
}

export function subscribeToRealtimeEvent(eventId: string, handler: (event: RealtimeEvent) => void) {
  realtimeBus.on(eventId, handler);
  return () => realtimeBus.off(eventId, handler);
}
