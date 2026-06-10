import { requirePageSession } from "@/lib/auth/session";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requirePageSession("/admin");
  return children;
}
