import { getR2Object, isEventR2Key } from "@/lib/storage/r2";

export async function GET(request: Request, { params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const key = new URL(request.url).searchParams.get("key");

  if (!key || !isEventR2Key(eventId, key)) {
    return new Response("Not found", { status: 404 });
  }

  const object = await getR2Object(key);
  if (!object) {
    return new Response("Not found", { status: 404 });
  }

  return new Response(new Uint8Array(object.buffer), {
    headers: {
      "Content-Type": object.contentType,
      "Cache-Control": "public, max-age=31536000, immutable"
    }
  });
}
