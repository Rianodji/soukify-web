"use client";

import Link from "next/link";
import {
  ShoppingBag, Package, Wallet, MessageSquare,
  TrendingUp, AlertCircle, ArrowRight, Shield, Plus,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatPrice } from "@/lib/utils";
import { Store } from "lucide-react";
import { fetchDashboardOverview, type DashboardOverviewData } from "./actions";
import { usePolledData } from "@/hooks/usePolledData";

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "success" | "warning" | "error" | "neutral" }> = {
  PENDING_PAYMENT: { label: "En attente",   variant: "warning" },
  PAID:            { label: "Payé",          variant: "default" },
  CONFIRMED:       { label: "Confirmé",      variant: "default" },
  IN_DELIVERY:     { label: "En livraison",  variant: "default" },
  COMPLETED:       { label: "Complété",      variant: "success" },
  CANCELLED:       { label: "Annulé",        variant: "neutral" },
  DISPUTED:        { label: "En litige",     variant: "error" },
};

function StatCard({
  label, value, icon: Icon, color, href,
}: {
  label: string; value: string | number; icon: React.ElementType;
  color: string; href?: string;
}) {
  const content = (
    <div className={`flex items-center gap-4 p-5 rounded-2xl border bg-white hover:shadow-md transition-all duration-200 ${href ? "cursor-pointer hover:border-brand" : ""}`}>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-text-secondary font-medium uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold text-text-primary mt-0.5">{value}</p>
      </div>
      {href && <ArrowRight className="w-4 h-4 text-text-disabled shrink-0" />}
    </div>
  );
  return href ? <Link href={href}>{content}</Link> : <div>{content}</div>;
}

interface DashboardOverviewProps {
  initialData: DashboardOverviewData;
  sellerMode: boolean;
  adminMode: boolean;
  isPro: boolean;
}

export function DashboardOverview({ initialData, sellerMode, adminMode, isPro }: DashboardOverviewProps) {
  const { data } = usePolledData(
    ["dashboard-overview", sellerMode, isPro],
    () => fetchDashboardOverview(sellerMode, isPro),
    initialData,
  );
  const { recentOrders, totalOrders, activeAnnonces, totalAnnonces, proShop } = data ?? initialData;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-5xl mx-auto">

      {/* ── Admin alert banner ───────────────────────────── */}
      {adminMode && (
        <div className="flex items-center gap-4 p-4 rounded-2xl bg-primary-50 border border-primary-200">
          <Shield className="w-8 h-8 text-brand shrink-0" />
          <div className="flex-1">
            <p className="font-semibold text-text-primary text-sm">Accès administrateur actif</p>
            <p className="text-xs text-text-secondary">Vous avez accès au backoffice. Gérez les utilisateurs, annonces et configuration.</p>
          </div>
          <Link href="/admin">
            <Button size="sm" variant="primary">
              Backoffice <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
      )}

      {/* ── Welcome ─────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">Bonjour 👋</h2>
          <p className="text-text-secondary text-sm mt-1">
            {sellerMode
              ? "Voici un aperçu de votre activité vendeur."
              : "Voici un aperçu de vos achats et messages."}
          </p>
        </div>
        {sellerMode && (
          <Link href="/dashboard/annonces/new">
            <Button size="md" variant="gold">
              <Plus className="w-4 h-4" />
              Publier une annonce
            </Button>
          </Link>
        )}
      </div>

      {/* ── Stat cards ──────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          label="Commandes"
          value={totalOrders}
          icon={ShoppingBag}
          color="bg-blue-50 text-blue-600"
          href="/dashboard/orders"
        />
        {sellerMode && (
          <StatCard
            label="Annonces actives"
            value={totalAnnonces}
            icon={Package}
            color="bg-primary-100 text-brand"
            href="/dashboard/annonces"
          />
        )}
        <StatCard
          label="Messages"
          value="—"
          icon={MessageSquare}
          color="bg-purple-50 text-purple-600"
          href="/dashboard/messages"
        />
        {sellerMode && (
          <StatCard
            label="Portefeuille"
            value="—"
            icon={Wallet}
            color="bg-accent-100 text-gold"
            href="/dashboard/wallet"
          />
        )}
        {!sellerMode && (
          <StatCard
            label="Gain total"
            value="N/A"
            icon={TrendingUp}
            color="bg-green-50 text-green-600"
          />
        )}
      </div>

      {/* ── Boutique PRO card ───────────────────────────────── */}
      {isPro && (
        <div>
          {proShop?.status === "APPROVED" ? (
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-border hover:border-brand hover:shadow-sm transition-all">
              <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0">
                {proShop.logoUrl
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={proShop.logoUrl} alt="" className="w-full h-full object-cover" />
                  : <div className="w-full h-full bg-brand flex items-center justify-center text-white font-bold">{proShop.name[0]?.toUpperCase()}</div>
                }
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Store className="w-4 h-4 text-brand" />
                  <span className="font-semibold text-text-primary truncate">{proShop.name}</span>
                  <Badge variant={(({ FREE: "neutral", STANDARD: "default", PREMIUM: "gold" } as Record<string, "neutral" | "default" | "gold">)[proShop.subscription]) ?? "neutral"}>
                    {proShop.subscription}
                  </Badge>
                </div>
                <p className="text-xs text-text-secondary mt-0.5">Boutique active · {(proShop.staff ?? []).length} membres</p>
              </div>
              <Link href="/dashboard/boutique">
                <Button size="sm" variant="secondary">Gérer <ArrowRight className="w-3.5 h-3.5" /></Button>
              </Link>
            </div>
          ) : proShop?.status === "PENDING" ? (
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-warning-light border border-warning">
              <Store className="w-5 h-5 text-warning shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-text-primary">Boutique en attente d'approbation</p>
                <p className="text-xs text-text-secondary">{proShop.name} · validation sous 24–48h</p>
              </div>
              <Link href="/dashboard/boutique" className="text-xs text-warning font-medium hover:underline whitespace-nowrap">
                Voir le statut →
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-primary-50 border border-primary-200">
              <Store className="w-5 h-5 text-brand shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-text-primary">Créez votre boutique Pro</p>
                <p className="text-xs text-text-secondary">Jusqu'à 1000 annonces, gestion d'équipe, CSV import</p>
              </div>
              <Link href="/dashboard/boutique">
                <Button size="sm" variant="primary">Créer <ArrowRight className="w-3.5 h-3.5" /></Button>
              </Link>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── Recent orders ───────────────────────────────── */}
        <section className="bg-white rounded-2xl border border-border">
          <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border">
            <h3 className="font-semibold text-text-primary">Commandes récentes</h3>
            <Link href="/dashboard/orders" className="text-xs text-brand hover:underline flex items-center gap-1">
              Voir tout <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center gap-3">
              <ShoppingBag className="w-10 h-10 text-border" />
              <p className="text-sm text-text-secondary">Aucune commande pour le moment.</p>
              <Link href="/">
                <Button size="sm" variant="secondary">Parcourir les annonces</Button>
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {recentOrders.map((order) => {
                const status = STATUS_CONFIG[order.status] ?? { label: order.status, variant: "neutral" as const };
                return (
                  <li key={order.id}>
                    <Link
                      href={`/dashboard/orders/${order.id}`}
                      className="flex items-center gap-3 px-5 py-3.5 hover:bg-primary-50 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center text-lg shrink-0">
                        📦
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text-primary truncate">
                          {order.annonceTitle ?? "Commande #" + order.id.slice(0, 8)}
                        </p>
                        <p className="text-xs text-text-secondary">{formatPrice(order.totalAmountCents / 100)}</p>
                      </div>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* ── Seller: recent annonces / Buyer: become seller ── */}
        {sellerMode ? (
          <section className="bg-white rounded-2xl border border-border">
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border">
              <h3 className="font-semibold text-text-primary">Mes annonces actives</h3>
              <Link href="/dashboard/annonces" className="text-xs text-brand hover:underline flex items-center gap-1">
                Gérer <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {activeAnnonces.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center gap-3">
                <Package className="w-10 h-10 text-border" />
                <p className="text-sm text-text-secondary">Aucune annonce active.</p>
                <Link href="/dashboard/annonces/new">
                  <Button size="sm" variant="primary">
                    <Plus className="w-4 h-4" /> Publier une annonce
                  </Button>
                </Link>
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {activeAnnonces.map((a) => (
                  <li key={a.id}>
                    <Link
                      href={`/dashboard/annonces/${a.id}`}
                      className="flex items-center gap-3 px-5 py-3.5 hover:bg-primary-50 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center text-lg shrink-0">
                        {a.images?.[0] ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={a.images[0]} alt="" className="w-full h-full object-cover rounded-xl" />
                        ) : "📦"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text-primary truncate">{a.title}</p>
                        <p className="text-xs text-text-secondary">{formatPrice(a.price)}</p>
                      </div>
                      <Badge variant="success">Active</Badge>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ) : (
          /* Buyer → invite to become seller */
          <section className="rounded-2xl overflow-hidden relative"
            style={{ background: "linear-gradient(135deg, #0d9488 0%, #0f766e 100%)" }}
          >
            <div className="absolute inset-0 opacity-10"
              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff'%3E%3Cpath d='M20 20h4v4h-4z'/%3E%3C/g%3E%3C/svg%3E")` }}
            />
            <div className="relative p-6 flex flex-col gap-4 h-full justify-between">
              <div className="space-y-2">
                <div className="text-3xl">🚀</div>
                <h3 className="text-lg font-bold text-white">Commencez à vendre !</h3>
                <p className="text-white/75 text-sm leading-relaxed">
                  Publiez vos articles gratuitement et atteignez des milliers d&apos;acheteurs au Tchad.
                </p>
              </div>
              <div className="space-y-3">
                {["Annonce publiée en 2 minutes", "Paiement sécurisé Mobile Money", "Support vendeur dédié"].map((f) => (
                  <div key={f} className="flex items-center gap-2 text-white/90 text-sm">
                    <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-xs">✓</span>
                    {f}
                  </div>
                ))}
              </div>
              <Link href="/dashboard/profile?tab=seller">
                <Button variant="gold" size="md" className="w-full">
                  Devenir vendeur <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </section>
        )}
      </div>

      {/* ── KYC alert for sellers ────────────────────────── */}
      {sellerMode && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-warning-light border border-accent-200">
          <AlertCircle className="w-5 h-5 text-warning mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-800">Vérifiez votre identité (KYC)</p>
            <p className="text-xs text-amber-700 mt-0.5">
              La vérification KYC renforce la confiance des acheteurs et débloque des fonctionnalités supplémentaires.
            </p>
          </div>
          <Link href="/dashboard/profile?tab=kyc">
            <Button size="sm" variant="secondary" className="text-xs shrink-0">Vérifier</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
