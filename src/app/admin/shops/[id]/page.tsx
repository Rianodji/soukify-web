import { notFound, unstable_rethrow } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft, Calendar,
  Users, TrendingUp, Package, ShoppingBag,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { serverGet, ServerApiError } from "@/infrastructure/http/ApiServer";
import { formatPrice } from "@/lib/utils";
import { ShopDetailActions } from "./ShopDetailActions";
import type { PublicUserProfile, Shop, ShopStats } from "@/types/api";

const STATUS_CONFIG: Record<string, { label: string; variant: "warning" | "success" | "error" | "neutral" }> = {
  PENDING:   { label: "En attente", variant: "warning" },
  ACTIVE:    { label: "Approuvée",  variant: "success" },
  REJECTED:  { label: "Rejetée",    variant: "error" },
  SUSPENDED: { label: "Suspendue",  variant: "error" },
};

const SUB_CONFIG: Record<string, { label: string; variant: "neutral" | "default" | "gold" }> = {
  FREE:     { label: "Gratuit",  variant: "neutral" },
  STANDARD: { label: "Standard", variant: "default" },
  PREMIUM:  { label: "Premium",  variant: "gold" },
};

const ROLE_LABELS: Record<string, string> = {
  OWNER:   "Propriétaire",
  MANAGER: "Manager",
  STAFF:   "Staff",
};

interface ShopDetailPageProps {
  params: Promise<{ id: string }>;
}

/** `GET /admin/shops/:id` now exists and returns a clean DTO (added 2026-07-24, cf. HANDOFF_INFRA.md). */
async function fetchShop(id: string): Promise<Shop | null> {
  try {
    return await serverGet<Shop>(`/admin/shops/${id}`, 0);
  } catch (e) {
    unstable_rethrow(e);
    if (e instanceof ServerApiError && e.statusCode === 404) return null;
    throw e;
  }
}

export default async function AdminShopDetailPage({ params }: ShopDetailPageProps) {
  const { id } = await params;

  const [shop, stats] = await Promise.all([
    fetchShop(id),
    serverGet<ShopStats>(`/pro/shops/${id}/stats`, 0).catch((e: unknown) => { unstable_rethrow(e); return null; }),
  ]);

  if (!shop) notFound();

  const status = STATUS_CONFIG[shop.status ?? ""] ?? { label: shop.status ?? "—", variant: "neutral" as const };
  const sub    = SUB_CONFIG[shop.plan] ?? { label: shop.plan, variant: "neutral" as const };
  const members = shop.members ?? [];

  /* No embedded user on `members` (just `userId`) — fetch each profile individually.
   * GET /admin/users/:id doesn't exist (cf. HANDOFF_INFRA.md), so this uses the
   * public profile instead. Team lists are small, so N+1 here is acceptable. */
  const memberProfiles = await Promise.all(
    members.map((m) => serverGet<PublicUserProfile>(`/users/${m.userId}/profile`, 60).catch((e: unknown) => { unstable_rethrow(e); return null; })),
  );
  const memberProfileById = new Map(members.map((m, i) => [m.userId, memberProfiles[i]]));
  const ownerId = members.find((m) => m.role === "OWNER")?.userId;
  const owner = ownerId ? (memberProfileById.get(ownerId) ?? null) : null;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      {/* Back */}
      <Link href="/admin/shops"
        className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-brand transition-colors">
        <ChevronLeft className="w-4 h-4" />
        Retour aux boutiques
      </Link>

      {/* Header */}
      <div className="bg-white rounded-2xl border border-border p-6">
        <div className="flex items-start gap-4">
          {shop.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={shop.logoUrl} alt="" className="w-16 h-16 rounded-2xl object-cover shrink-0" />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-brand flex items-center justify-center text-white text-2xl font-bold shrink-0">
              {shop.name[0]?.toUpperCase()}
            </div>
          )}
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant={status.variant}>{status.label}</Badge>
              <Badge variant={sub.variant}>{sub.label}</Badge>
            </div>
            <h1 className="text-xl font-bold text-text-primary">{shop.name}</h1>
            {shop.description && (
              <p className="text-sm text-text-secondary leading-relaxed">{shop.description}</p>
            )}
            <p className="text-xs text-text-disabled">
              Créée le {new Date(shop.createdAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-6">
        {/* Left column */}
        <div className="space-y-5">

          {/* Stats (if available) */}
          {stats && (
            <div className="bg-white rounded-2xl border border-border p-5 space-y-4">
              <h2 className="font-semibold text-text-primary flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-text-disabled" />
                Statistiques
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Annonces publiées", value: stats.publishedAnnonces, icon: Package, color: "text-brand", bg: "bg-primary-50" },
                  { label: "Total annonces",    value: stats.totalAnnonces,     icon: Package, color: "text-text-secondary", bg: "bg-border" },
                  { label: "Commandes",         value: stats.totalOrders,       icon: ShoppingBag, color: "text-success", bg: "bg-success-light" },
                  { label: "Revenus",           value: formatPrice((stats.totalRevenueCents ?? 0) / 100), icon: TrendingUp, color: "text-gold", bg: "bg-accent-100" },
                ].map(({ label, value, icon: Icon, color, bg }) => (
                  <div key={label} className="flex items-center gap-2.5 p-3 rounded-xl bg-background border border-border">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${bg}`}>
                      <Icon className={`w-4 h-4 ${color}`} />
                    </div>
                    <div>
                      <p className="text-[10px] text-text-disabled uppercase tracking-wide">{label}</p>
                      <p className="text-sm font-bold text-text-primary">{value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Owner */}
          <div className="bg-white rounded-2xl border border-border p-5 space-y-4">
            <h2 className="font-semibold text-text-primary">Propriétaire</h2>
            {owner ? (
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-full bg-brand flex items-center justify-center text-white font-bold shrink-0">
                  {owner.displayName?.[0]?.toUpperCase() ?? "?"}
                </div>
                <div className="flex-1 space-y-1.5">
                  <p className="font-semibold text-text-primary">{owner.displayName}</p>
                  <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                    <Calendar className="w-3.5 h-3.5 text-text-disabled" />
                    <span>Membre depuis {new Date(owner.memberSince).toLocaleDateString("fr-FR")}</span>
                  </div>
                  <p className="text-xs text-text-secondary">Score de confiance : {owner.score}</p>
                  {ownerId && (
                    <Link
                      href={`/admin/users/${ownerId}`}
                      className="block text-xs text-brand hover:underline mt-1"
                    >
                      Voir le profil admin →
                    </Link>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-sm text-text-disabled">Propriétaire introuvable</p>
            )}
          </div>

          {/* Staff */}
          <div className="bg-white rounded-2xl border border-border overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h2 className="font-semibold text-text-primary flex items-center gap-2">
                <Users className="w-4 h-4 text-text-disabled" />
                Équipe
              </h2>
              <span className="text-xs text-text-disabled">{members.length} membre{members.length !== 1 ? "s" : ""}</span>
            </div>

            {members.length === 0 ? (
              <div className="flex items-center justify-center py-10 text-sm text-text-disabled">
                Aucun membre renseigné
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {members.map((member) => {
                  const profile = memberProfileById.get(member.userId);
                  const label = profile?.displayName ?? `Utilisateur #${member.userId.slice(0, 8)}`;
                  return (
                  <li key={member.userId} className="flex items-center gap-3 px-5 py-3.5">
                    <div className="w-9 h-9 rounded-full bg-primary-50 flex items-center justify-center text-brand font-bold text-sm shrink-0">
                      {label[0]?.toUpperCase() ?? "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate">{label}</p>
                    </div>
                    <Badge variant={member.role === "OWNER" ? "gold" : member.role === "MANAGER" ? "default" : "neutral"}>
                      {ROLE_LABELS[member.role] ?? member.role}
                    </Badge>
                  </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        {/* Right column — actions */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-border p-5 space-y-3">
            <h2 className="font-semibold text-text-primary text-sm">Actions</h2>
            <ShopDetailActions shopId={shop.id} status={shop.status ?? "ACTIVE"} />
          </div>

          {/* Meta */}
          <div className="bg-background rounded-2xl border border-border p-4 space-y-2">
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Informations</p>
            <dl className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <dt className="text-text-disabled">ID</dt>
                <dd className="font-mono text-text-secondary">{shop.id.slice(0, 12)}…</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-text-disabled">Abonnement</dt>
                <dd className="font-medium text-text-primary">
                  {SUB_CONFIG[shop.plan]?.label ?? shop.plan}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-text-disabled">Statut</dt>
                <dd className="font-medium text-text-primary">
                  {status.label}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-text-disabled">Créée le</dt>
                <dd className="text-text-secondary">{new Date(shop.createdAt).toLocaleDateString("fr-FR")}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
