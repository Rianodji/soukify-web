import { unstable_rethrow } from "next/navigation";
import { getSession } from "@/lib/session";
import { serverGet } from "@/infrastructure/http/ApiServer";
import { Badge } from "@/components/ui/Badge";
import { Phone, Shield, CheckCircle, Clock, Calendar, User } from "lucide-react";
import { EditProfileForm } from "./EditProfileForm";
import { KycForm } from "./KycForm";
import { formatPhoneDisplay } from "@/lib/utils";
import type { UserProfile } from "@/types/api";

const ROLE_LABELS: Record<string, string> = {
  BUYER: "Acheteur", SELLER: "Vendeur", PRO_SELLER: "Vendeur Pro",
  ADMIN: "Admin", SUPPORT: "Support", FINANCE: "Finance",
  ACCOUNT_MANAGER: "Account Manager", SUPER_ADMIN: "Super Admin",
};

export default async function ProfilePage() {
  const session = await getSession();
  let profile: UserProfile | null = null;

  try {
    profile = await serverGet<UserProfile>("/users/me", 0);
  } catch (e) { unstable_rethrow(e); /* handled below */ }

  const name      = profile?.name       ?? "Utilisateur";
  const phone     = profile?.phoneNumber ?? "";
  const isKyc     = profile?.isKycVerified ?? false;
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
                {phone ? formatPhoneDisplay(phone) : "—"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 px-6 py-4">
            <Shield className="w-4 h-4 text-text-disabled shrink-0" />
            <div className="flex-1">
              <p className="text-xs text-text-secondary">Vérification KYC</p>
              <div className="flex items-center gap-2 mt-0.5">
                {isKyc ? (
                  <><CheckCircle className="w-4 h-4 text-success" /><span className="text-sm font-medium text-success">Identité vérifiée</span></>
                ) : (
                  <><Clock className="w-4 h-4 text-warning" /><span className="text-sm font-medium text-warning">Non vérifié</span></>
                )}
              </div>
            </div>
          </div>
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
      {isKyc ? (
        <div className="flex items-center gap-3 p-5 rounded-2xl bg-success-light border border-success">
          <CheckCircle className="w-5 h-5 text-success shrink-0" />
          <div>
            <p className="text-sm font-semibold text-text-primary">Identité vérifiée</p>
            <p className="text-xs text-text-secondary mt-0.5">Votre identité a été vérifiée. Cela renforce la confiance avec les autres utilisateurs.</p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-border overflow-hidden">
          <div className="flex items-center gap-2 px-6 py-4 border-b border-border bg-warning-light">
            <Shield className="w-4 h-4 text-warning" />
            <h3 className="font-semibold text-amber-800 text-sm">Vérifiez votre identité (KYC)</h3>
          </div>
          <div className="p-6 space-y-4">
            <p className="text-sm text-text-secondary leading-relaxed">
              La vérification KYC est <strong>gratuite</strong>, prend 2 minutes, et débloque le badge de confiance sur vos annonces.
            </p>
            <ul className="text-sm text-text-secondary space-y-1.5">
              {["Pièce d'identité nationale ou passeport", "Selfie tenant votre pièce d'identité"].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary-100 text-brand text-xs flex items-center justify-center font-bold shrink-0">✓</span>
                  {item}
                </li>
              ))}
            </ul>
            <KycForm />
          </div>
        </div>
      )}
    </div>
  );
}
