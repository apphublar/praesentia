import { cookies } from "next/headers";
import {
  MURAL_SESSION_COOKIE,
  verifyMuralSessionToken,
  type MuralSessionPayload
} from "@/lib/mural/session-cookie";

export async function getMuralSession(eventId?: string): Promise<MuralSessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(MURAL_SESSION_COOKIE)?.value;
  const payload = token ? verifyMuralSessionToken(token) : null;
  if (!payload) return null;
  if (eventId && payload.eventId !== eventId) return null;
  return payload;
}
