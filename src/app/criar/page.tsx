import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth/session";
import { CREATE_EVENT_PATH, loginPathWithNext } from "@/lib/auth/routes";

export default async function CreateLegacyRedirectPage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getCurrentSession();
  const params = (await searchParams) ?? {};
  const error = typeof params.erro === "string" ? `?erro=${params.erro}` : "";

  if (session) {
    redirect(`${CREATE_EVENT_PATH}${error}`);
  }

  redirect(loginPathWithNext(`${CREATE_EVENT_PATH}${error}`));
}
