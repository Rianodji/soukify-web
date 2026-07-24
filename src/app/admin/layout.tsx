import { redirect, unstable_rethrow } from "next/navigation";
import { getSession, isAdmin } from "@/lib/session";
import { serverGet } from "@/infrastructure/http/ApiServer";
import { AdminShell } from "./AdminShell";
import type { MyProfile } from "@/types/api";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session || !isAdmin(session)) redirect("/dashboard");

  let userName = "Administrateur";
  try {
    const profile = await serverGet<MyProfile>("/users/me", 0);
    userName = profile.displayName || "Administrateur";
  } catch (e) {
    unstable_rethrow(e);
    /* silently degrade */
  }

  return (
    <AdminShell userRoles={session.roles} userName={userName}>
      {children}
    </AdminShell>
  );
}
