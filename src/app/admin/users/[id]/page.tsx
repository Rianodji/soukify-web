import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft, Phone, Calendar, Shield,
  Package, Star, MapPin, Clock,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { serverGet } from "@/infrastructure/http/ApiServer";
import { formatPrice, formatPhoneDisplay } from "@/lib/utils";
import { UserProfileActions } from "./UserProfileActions";
import type { AdminUser, Annonce, PaginatedResponse, Review, UserScore, KycStatus, UserRole } from "@/types/api";

const KYC_CONFIG: Record<KycStatus, { label: string; variant: "success" | "warning" | "error" | "neutral" }> = {
  APPROVED: { label: "KYC vérifié",    variant: "success" },
  PENDING:  { label: "KYC en attente", variant: "warning" },
  REJECTED: { label: "KYC rejeté",     variant: "error" },
  NONE:     { label: "Non vérifié",    variant: "neutral" },
};

const ROLE_LABELS: Record<string, string> = {
  BUYER: "Acheteur", SELLER: "Vendeur", PRO: "Vendeur Pro",
  ADMIN: "Admin", ACCOUNT_MANAGER: "Account Manager",
  SUPPORT: "Support", FINANCE: "Finance", SUPER_ADMIN: "Super Admin",
};

const CONDITION_LABELS: Record<string, string> = {
  NEW: "Neuf", LIKE_NEW: "Comme neuf", GOOD: "Bon état", FAIR: "Correct", POOR: "À réparer",
};

async function fetchUser(id: string): Promise<AdminUser | null> {
  try { return await serverGet<AdminUser>(`/admin/users/${id}`, 0); }
  catch { return null; }
}

interface UserDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminUserDetailPage({ params }: UserDetailPageProps) {
  const { id } = await params;

  const [user, annoncesRes, reviews, score] = await Promise.all([
    fetchUser(id),
    serverGet<PaginatedResponse<Annonce>>(`/search/annonces?sellerId=${id}&limit=6`, 0).catch(() => null),
    serverGet<Review[]>(`/users/${id}/reviews`).catch(() => null),
    serverGet<UserScore>(`/users/${id}/score`).catch(() => null),
  ]);

  if (!user) notFound();

  const kyc = KYC_CONFIG[user.kycStatus ?? "NONE"];
  const annonces = annoncesRes?.items ?? [];
  const isSeller = user.roles.some((r) => ["SELLER", "PRO"].includes(r));

  const primaryRole: UserRole = (
    user.roles.find((r) => ["SUPER_ADMIN","ADMIN","FINANCE","SUPPORT","ACCOUNT_MANAGER"].includes(r)) ??
    user.roles.find((r) => ["PRO","SELLER"].includes(r)) ??
    "BUYER"
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      {/* Back */}
      <Link href="/admin/users"
        className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-brand transition-colors">
        <ChevronLeft className="w-4 h-4" />
        Retour aux utilisateurs
      </Link>

      {/* Profile header */}
      <div className="bg-white rounded-2xl border border-border p-6">
        <div className="flex items-start gap-5 flex-wrap">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-brand flex items-center justify-center text-white text-2xl font-bold">
              {user.name?.[0]?.toUpperCase() ?? "?"}
            </div>
            {user.isSuspended && (
              <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full bg-error border-2 border-white flex items-center justify-center">
                <span className="text-white text-[10px] font-bold">S</span>
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-text-primary">{user.name}</h1>
              {user.isSuspended && <Badge variant="error">Suspendu</Badge>}
              <Badge variant={kyc.variant}>{kyc.label}</Badge>
            </div>

            <div className="flex flex-wrap gap-3 text-sm text-text-secondary">
              <span className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-text-disabled" />
                <span className="font-mono">{formatPhoneDisplay(user.phoneNumber)}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-text-disabled" />
                Inscrit le {new Date(user.createdAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}
              </span>
              {score && (
                <span className="flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 text-gold" fill="currentColor" />
                  <span className="text-xs">{score.reviewCount} avis</span>
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-1.5">
              {user.roles.map((r) => (
                <Badge key={r} variant="default" className="text-xs">
                  {ROLE_LABELS[r] ?? r}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-6">
        {/* Left */}
        <div className="space-y-5">

          {/* Annonces (sellers only) */}
          {isSeller && (
            <div className="bg-white rounded-2xl border border-border overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                <h2 className="font-semibold text-text-primary flex items-center gap-2">
                  <Package className="w-4 h-4 text-text-disabled" />
                  Annonces récentes
                </h2>
                <span className="text-xs text-text-disabled">
                  {annoncesRes?.total ?? 0} au total
                </span>
              </div>

              {annonces.length === 0 ? (
                <div className="flex items-center justify-center py-10 text-sm text-text-disabled">
                  Aucune annonce
                </div>
              ) : (
                <ul className="divide-y divide-border">
                  {annonces.map((a) => (
                    <li key={a.id}>
                      <Link
                        href={`/admin/annonces?q=${encodeURIComponent(a.title)}`}
                        className="flex items-center gap-3 px-5 py-3.5 hover:bg-primary-50 transition-colors group"
                      >
                        <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center shrink-0 overflow-hidden">
                          {a.images?.[0] ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={a.images[0]} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <Package className="w-5 h-5 text-primary-300" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-text-primary group-hover:text-brand transition-colors truncate">
                            {a.title}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5 text-xs text-text-secondary">
                            <span className="font-semibold text-brand">{formatPrice(a.price)}</span>
                            <span className="flex items-center gap-0.5">
                              <MapPin className="w-3 h-3" />{a.city}
                            </span>
                            <span>{CONDITION_LABELS[a.condition] ?? a.condition}</span>
                          </div>
                        </div>
                        <Badge variant={a.status === "ACTIVE" ? "success" : a.status === "DRAFT" ? "warning" : "neutral"}>
                          {a.status === "ACTIVE" ? "Active" : a.status === "DRAFT" ? "Brouillon" : a.status}
                        </Badge>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Reviews */}
          {reviews && reviews.length > 0 && (
            <div className="bg-white rounded-2xl border border-border overflow-hidden">
              <div className="px-5 py-4 border-b border-border">
                <h2 className="font-semibold text-text-primary flex items-center gap-2">
                  <Star className="w-4 h-4 text-text-disabled" />
                  Avis reçus ({reviews.length})
                </h2>
              </div>
              <ul className="divide-y divide-border">
                {reviews.slice(0, 5).map((review) => (
                  <li key={review.id} className="px-5 py-3.5">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-text-primary">{review.reviewer.name}</span>
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`w-3.5 h-3.5 ${i < review.rating ? "text-gold" : "text-border"}`}
                            fill={i < review.rating ? "currentColor" : "none"} />
                        ))}
                      </div>
                    </div>
                    {review.comment && (
                      <p className="text-sm text-text-secondary leading-relaxed">{review.comment}</p>
                    )}
                    <p className="text-xs text-text-disabled mt-1">
                      {new Date(review.createdAt).toLocaleDateString("fr-FR")}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* No activity for buyer */}
          {!isSeller && (!reviews || reviews.length === 0) && (
            <div className="bg-white rounded-2xl border border-border p-8 text-center">
              <p className="text-text-disabled text-sm">
                Compte acheteur — pas d'annonces ni d'avis vendeur.
              </p>
            </div>
          )}
        </div>

        {/* Right — actions + meta */}
        <div className="space-y-4">
          {/* Actions */}
          <div className="bg-white rounded-2xl border border-border p-5">
            <h2 className="font-semibold text-text-primary text-sm mb-4">Actions administrateur</h2>
            <UserProfileActions
              userId={user.id}
              kycStatus={user.kycStatus ?? "NONE"}
              isSuspended={user.isSuspended}
              primaryRole={primaryRole}
            />
          </div>

          {/* Score */}
          {score && (
            <div className="bg-white rounded-2xl border border-border p-5 space-y-3">
              <h2 className="font-semibold text-text-primary text-sm">Score de confiance</h2>
              <div className="text-center">
                <p className="text-3xl font-bold text-brand">{score.score}</p>
                <p className="text-xs text-text-secondary mt-1">
                  {score.positiveCount} avis positifs / {score.reviewCount} total
                </p>
              </div>
              <div className="h-2 bg-border rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand rounded-full"
                  style={{ width: `${Math.min(score.score, 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* Meta */}
          <div className="bg-background rounded-2xl border border-border p-4 space-y-2">
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Informations</p>
            <dl className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <dt className="text-text-disabled">ID</dt>
                <dd className="font-mono text-text-secondary">{user.id.slice(0, 12)}…</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-text-disabled">Inscription</dt>
                <dd className="text-text-secondary">{new Date(user.createdAt).toLocaleDateString("fr-FR")}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-text-disabled">Rôle principal</dt>
                <dd className="font-medium text-text-primary">{ROLE_LABELS[primaryRole] ?? primaryRole}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-text-disabled">Statut</dt>
                <dd className={user.isSuspended ? "text-error font-medium" : "text-success font-medium"}>
                  {user.isSuspended ? "Suspendu" : "Actif"}
                </dd>
              </div>
            </dl>
          </div>

          {/* Quick links */}
          <div className="bg-white rounded-2xl border border-border p-4 space-y-2">
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Liens rapides</p>
            <div className="space-y-1">
              <Link href={`/admin/reports?reporter=${user.id}`}
                className="flex items-center gap-2 text-sm text-text-secondary hover:text-brand transition-colors py-1">
                <Shield className="w-3.5 h-3.5" />
                Signalements déposés
              </Link>
              <a href={`/vendeurs/${user.id}`} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-text-secondary hover:text-brand transition-colors py-1">
                <Clock className="w-3.5 h-3.5" />
                Profil public
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
