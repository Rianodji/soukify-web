import { unstable_rethrow } from "next/navigation";
import { getSession } from "@/lib/session";
import { serverGet } from "@/infrastructure/http/ApiServer";
import { Badge } from "@/components/ui/Badge";
import { Phone, Calendar, User } from "lucide-react";
import { EditProfileForm } from "./EditProfileForm";
import { KycBadgeRow } from "./KycBadgeRow";
import { KycStatusPanel } from "./KycStatusPanel";
import type { MyProfile } from "@/types/api";

const ROLE_LABELS: Record<string, string> = {
  BUYER: "Acheteur", SELLER: "Vendeur", PRO_SELLER: "Vendeur Pro",
  ADMIN: "Admin", SUPPORT: "Support", FINANCE: "Finance",
  ACCOUNT_MANAGER: "Account Manager", SUPER_ADMIN: "Super Admin",
};

export default async function ProfilePage() {
  const session = await getSession();
  let profile: MyProfile | null = null;

  try {
    profile = await serverGet<MyProfile>("/users/me", 0);
  } catch (e) { unstable_rethrow(e); /* handled below */ }

  const name      = profile?.displayName ?? "Utilisateur";
  /* phoneNumber from GET /users/me is already masked (e.g. "+235••••••23") — display as-is. */
  const phone     = profile?.phoneNumber ?? "";
  const createdAt = profile?.createdAt;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto space-y-6">
      <h2 className="text-xl font-bold text-text-primary">Mon profil</h2>

      {/* Avatar + roles */}
      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        <div className="flex items-center gap-4 p-6 border-b border-border"
          style={{ background: "linear-gradient(135deg, #f0fdfa, #ccfbf1)" }}>
          <div className="w-16 h-16 rounded-2xl bg-brand flex items-center justify-center text-white text-2xl font-bold shrink-0">
            {name[0]?.toUpperCase() ?? "?"}
          </div>
          <div>
            <h3 className="text-lg font-bold text-text-primary">{name}</h3>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {(session?.roles ?? []).map((r) => (
                <Badge key={r} variant="default">{ROLE_LABELS[r] ?? r}</Badge>
              ))}
            </div>
          </div>
        </div>

        <div className="divide-y divide-border">
          <div className="flex items-center gap-3 px-6 py-4">
            <Phone className="w-4 h-4 text-text-disabled shrink-0" />
            <div>
              <p className="text-xs text-text-secondary">Téléphone</p>
              <p className="text-sm font-medium text-text-primary font-mono">
                {phone || "—"}
              </p>
            </div>
          </div>
          <KycBadgeRow initialProfile={profile} />
          {createdAt && (
            <div className="flex items-center gap-3 px-6 py-4">
              <Calendar className="w-4 h-4 text-text-disabled shrink-0" />
              <div>
                <p className="text-xs text-text-secondary">Membre depuis</p>
                <p className="text-sm font-medium text-text-primary">
                  {new Date(createdAt).toLocaleDateString("fr-FR", { year: "numeric", month: "long" })}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit name */}
      <div className="bg-white rounded-2xl border border-border p-6 space-y-4">
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-text-disabled" />
          <h3 className="font-semibold text-text-primary text-sm">Modifier mon profil</h3>
        </div>
        <EditProfileForm currentName={name} />
      </div>

      {/* KYC */}
      <KycStatusPanel initialProfile={profile} />
    </div>
  );
}
