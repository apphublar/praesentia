import { NextResponse } from "next/server";
import { subscribeToRealtimeEvent } from "@/lib/realtime/bus";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await context.params;
  const encoder = new TextEncoder();
  let heartbeat: ReturnType<typeof setInterval> | null = null;
  let unsubscribe: (() => void) | null = null;
  function cleanup() {
    if (heartbeat) clearInterval(heartbeat);
    unsubscribe?.();
  }

  const stream = new ReadableStream<Uint8Array>({
    cancel() {
      cleanup();
    },
    start(controller) {
      controller.enqueue(encoder.encode(`event: ready\ndata: {"eventId":"${eventId}"}\n\n`));

      unsubscribe = subscribeToRealtimeEvent(eventId, (event) => {
        controller.enqueue(encoder.encode(`event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`));
      });

      heartbeat = setInterval(() => {
        controller.enqueue(encoder.encode(`event: heartbeat\ndata: {}\n\n`));
      }, 25_000);
    }
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive"
    }
  });
}
