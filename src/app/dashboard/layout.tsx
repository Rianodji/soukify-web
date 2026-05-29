import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { serverGet } from "@/infrastructure/http/ApiServer";
import { DashboardShell } from "./DashboardShell";
import type { UserProfile } from "@/types/api";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  let userName = "Utilisateur";
  try {
    const profile = await serverGet<UserProfile>("/users/me", 0);
    userName = profile.name || "Utilisateur";
  } catch {
    /* silently degrade — middleware already validated token */
  }

  return (
    <DashboardShell
      userRoles={session.roles}
      userName={userName}
      pageTitle="Dashboard"
    >
      {children}
    </DashboardShell>
  );
}
