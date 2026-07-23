import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { serverGet } from "@/infrastructure/http/ApiServer";
import { formatPrice } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  TrendingUp, Package, ShoppingBag, Users, Clock,
  XCircle, AlertTriangle, Plus, MapPin, Trash2, Eye,
} from "lucide-react";
import { CreateShopForm } from "./CreateShopForm";
import { ShopEquipe } from "./ShopEquipe";
import { ShopAbonnement } from "./ShopAbonnement";
import { ShopParametres } from "./ShopParametres";
import { LogoUpload } from "./LogoUpload";
import { CsvImport } from "./CsvImport";
import type { Shop, PaginatedResponse, ShopStats, Annonce } from "@/types/api";
import { publishAnnonce, deleteOwnAnnonce } from "../actions";

type Tab = "apercu" | "annonces" | "equipe" | "abonnement" | "parametres";

const TABS: Array<{ id: Tab; label: string }> = [
  { id: "apercu",     label: "Aperçu" },
  { id: "annonces",   label: "Annonces" },
  { id: "equipe",     label: "Équipe" },
  { id: "abonnement", label: "Abonnement" },
  { id: "parametres", label: "Paramètres" },
];

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Active", DRAFT: "Brouillon", SOLD: "Vendue", EXPIRED: "Expirée", DELETED: "Supprimée",
};
const STATUS_VARIANTS: Record<string, "success" | "warning" | "neutral" | "error"> = {
  ACTIVE: "success", DRAFT: "warning", SOLD: "neutral", EXPIRED: "error", DELETED: "error",
};

async function getMyShop(): Promise<Shop | null> {
  try {
    const res = await serverGet<PaginatedResponse<Shop> | Shop>("/pro/shops", 0);
    if ("data" in res) return res.data[0] ?? null;
    return res as Shop;
  } catch { return null; }
}

interface BoutiquePageProps {
  searchParams: Promise<{ tab?: Tab; status?: string }>;
}

export default async function BoutiquePage({ searchParams }: BoutiquePageProps) {
  const session = await getSession();
  if (!session?.roles.includes("PRO_SELLER")) redirect("/dashboard");

  const [sp, shop] = await Promise.all([searchParams, getMyShop()]);
  const tab = sp.tab ?? "apercu";
  const annonceStatus = sp.status ?? "";

  /* ── No shop ─────────────────────────────────────────────── */
  if (!shop) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-text-primary">Ma boutique</h2>
          <p className="text-sm text-text-secondary mt-0.5">Espace vendeur Pro</p>
        </div>
        <CreateShopForm />
      </div>
    );
  }

  /* ── Pending ─────────────────────────────────────────────── */
  if (shop.status === "PENDING") {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-lg mx-auto">
        <div className="bg-white rounded-2xl border border-border p-8 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-warning-light flex items-center justify-center mx-auto">
            <Clock className="w-8 h-8 text-warning" />
          </div>
          <h2 className="text-xl font-bold text-text-primary">Demande en cours d&apos;examen</h2>
          <p className="text-sm text-text-secondary">
            Votre boutique <span className="font-semibold">{shop.name}</span> est en attente de validation.
          </p>
          <p className="text-xs text-text-disabled">Délai habituel : 24–48h ouvrées</p>
        </div>
      </div>
    );
  }

  /* ── Rejected ─────────────────────────────────────────────── */
  if (shop.status === "REJECTED") {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-lg mx-auto space-y-6">
        <div className="bg-white rounded-2xl border border-error p-8 text-center space-y-3">
          <XCircle className="w-12 h-12 text-error mx-auto" />
          <h2 className="text-xl font-bold text-text-primary">Demande refusée</h2>
          <p className="text-sm text-text-secondary">
            Votre demande pour <span className="font-semibold">{shop.name}</span> n&apos;a pas été approuvée.
            Vous pouvez en soumettre une nouvelle.
          </p>
        </div>
        <CreateShopForm />
      </div>
    );
  }

  /* ── Suspended ────────────────────────────────────────────── */
  if (shop.status === "SUSPENDED") {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-lg mx-auto">
        <div className="bg-white rounded-2xl border border-error p-8 text-center space-y-3">
          <AlertTriangle className="w-12 h-12 text-error mx-auto" />
          <h2 className="text-xl font-bold text-text-primary">Boutique suspendue</h2>
          <p className="text-sm text-text-secondary">
            Votre boutique a été suspendue. Contactez le support pour plus d&apos;informations.
          </p>
          <a href="mailto:support@soukify.td" className="inline-block text-sm text-brand hover:underline">
            Contacter le support →
          </a>
        </div>
      </div>
    );
  }

  /* ── Approved ─────────────────────────────────────────────── */
  const [stats, annoncesRes] = await Promise.all([
    serverGet<ShopStats>(`/pro/shops/${shop.id}/stats`, 0).catch(() => null),
    (tab === "annonces" || tab === "apercu")
      ? serverGet<PaginatedResponse<Annonce>>(
          `/users/me/annonces?limit=10${annonceStatus ? `&status=${annonceStatus}` : ""}`,
          0,
        ).catch(() => null)
      : Promise.resolve(null),
  ]);

  const members = shop.staff ?? [];
  const annonces = annoncesRes?.data ?? [];
  const annoncesTotal = annoncesRes?.total ?? 0;

  const isStandardPlus = shop.subscription === "STANDARD" || shop.subscription === "PREMIUM";

  const SUB_LABELS: Record<string, string> = { FREE: "Gratuit", STANDARD: "Standard", PREMIUM: "Premium" };
  const SUB_VARIANTS: Record<string, "neutral" | "default" | "gold"> = { FREE: "neutral", STANDARD: "default", PREMIUM: "gold" };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl overflow-hidden shrink-0">
          {shop.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={shop.logoUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-brand flex items-center justify-center text-white text-2xl font-bold">
              {shop.name[0]?.toUpperCase()}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl font-bold text-text-primary">{shop.name}</h2>
            <Badge variant={SUB_VARIANTS[shop.subscription] ?? "neutral"}>
              {SUB_LABELS[shop.subscription] ?? shop.subscription}
            </Badge>
            <Badge variant="success">Active</Badge>
          </div>
          {shop.description && (
            <p className="text-sm text-text-secondary mt-0.5 truncate">{shop.description}</p>
          )}
        </div>
        <Link href="/dashboard/annonces/new">
          <Button size="sm" variant="gold">
            <Plus className="w-4 h-4" /> Publier
          </Button>
        </Link>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <nav className="flex gap-0 -mb-px overflow-x-auto">
          {TABS.map(({ id, label }) => (
            <Link key={id} href={`/dashboard/boutique?tab=${id}`}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                tab === id
                  ? "border-brand text-brand"
                  : "border-transparent text-text-secondary hover:text-text-primary hover:border-border"
              }`}>
              {label}
              {id === "annonces" && annoncesTotal > 0 && tab !== "annonces" && (
                <span className="ml-1.5 text-xs bg-primary-100 text-brand px-1.5 py-0.5 rounded-full font-semibold">
                  {annoncesTotal}
                </span>
              )}
            </Link>
          ))}
        </nav>
      </div>

      {/* ── Aperçu ──────────────────────────────────────────── */}
      {tab === "apercu" && (
        <div className="space-y-6">
          {/* KPI grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Annonces actives", value: stats?.activeAnnonces ?? annonces.filter(a => a.status === "ACTIVE").length, icon: Package, color: "text-brand", bg: "bg-primary-50" },
              { label: "Commandes totales", value: stats?.totalOrders ?? "—", icon: ShoppingBag, color: "text-success", bg: "bg-success-light" },
              { label: "Revenus du mois", value: stats ? formatPrice(stats.monthlyRevenue) : "—", icon: TrendingUp, color: "text-gold", bg: "bg-accent-100" },
              { label: "Membres équipe", value: members.length, icon: Users, color: "text-brand", bg: "bg-primary-50" },
            ].map(({ label, value, icon: Icon, color, bg }) => (
              <div key={label} className="bg-white rounded-2xl border border-border p-4 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${bg}`}>
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
                <div>
                  <p className="text-xs text-text-secondary">{label}</p>
                  <p className="font-bold text-text-primary">{value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Recent annonces */}
          {annonces.length > 0 && (
            <div className="bg-white rounded-2xl border border-border overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                <h3 className="font-semibold text-text-primary text-sm">Annonces récentes</h3>
                <Link href="/dashboard/boutique?tab=annonces" className="text-xs text-brand hover:underline">
                  Tout gérer →
                </Link>
              </div>
              <ul className="divide-y divide-border">
                {annonces.slice(0, 5).map((a) => (
                  <li key={a.id} className="flex items-center gap-3 px-5 py-3 hover:bg-background transition-colors">
                    <div className="w-9 h-9 rounded-lg bg-primary-50 flex items-center justify-center shrink-0 overflow-hidden">
                      {a.images?.[0]
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img src={a.images[0]} alt="" className="w-full h-full object-cover" />
                        : <Package className="w-4 h-4 text-primary-300" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate">{a.title}</p>
                      <p className="text-xs text-text-secondary">{formatPrice(a.price)}</p>
                    </div>
                    <Badge variant={STATUS_VARIANTS[a.status] ?? "neutral"}>
                      {STATUS_LABELS[a.status] ?? a.status}
                    </Badge>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {annonces.length === 0 && (
            <div className="bg-white rounded-2xl border border-border p-10 text-center space-y-3">
              <Package className="w-10 h-10 text-border mx-auto" />
              <p className="text-sm text-text-secondary">Aucune annonce publiée pour le moment.</p>
              <Link href="/dashboard/annonces/new">
                <Button size="sm" variant="primary">
                  <Plus className="w-4 h-4" /> Publier une annonce
                </Button>
              </Link>
            </div>
          )}
        </div>
      )}

      {/* ── Annonces ────────────────────────────────────────── */}
      {tab === "annonces" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h3 className="font-semibold text-text-primary">Mes annonces</h3>
              <p className="text-xs text-text-secondary mt-0.5">{annoncesTotal} au total</p>
            </div>
            <div className="flex gap-2">
              {isStandardPlus && <CsvImport shopId={shop.id} />}
              <Link href="/dashboard/annonces/new">
                <Button size="sm" variant="gold">
                  <Plus className="w-4 h-4" /> Nouvelle annonce
                </Button>
              </Link>
            </div>
          </div>

          {/* Status filter */}
          <div className="flex gap-2 flex-wrap">
            {["", "ACTIVE", "DRAFT", "SOLD", "EXPIRED"].map((s) => (
              <Link
                key={s}
                href={`/dashboard/boutique?tab=annonces${s ? `&status=${s}` : ""}`}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  annonceStatus === s
                    ? "bg-brand text-white border-brand"
                    : "border-border text-text-secondary hover:border-brand hover:text-brand"
                }`}
              >
                {s === "" ? "Toutes" : STATUS_LABELS[s] ?? s}
              </Link>
            ))}
          </div>

          {annonces.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 bg-white rounded-2xl border border-border">
              <Package className="w-10 h-10 text-border" />
              <p className="text-sm text-text-secondary">Aucune annonce trouvée.</p>
              <Link href="/dashboard/annonces/new">
                <Button size="sm" variant="primary"><Plus className="w-4 h-4" /> Publier</Button>
              </Link>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-border overflow-hidden">
              <ul className="divide-y divide-border">
                {annonces.map((a) => (
                  <li key={a.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-background transition-colors">
                    <div className="w-12 h-12 rounded-xl bg-primary-50 shrink-0 overflow-hidden">
                      {a.images?.[0]
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img src={a.images[0]} alt="" className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center"><Package className="w-6 h-6 text-primary-300" /></div>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-text-primary truncate">{a.title}</p>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-text-secondary">
                        <span className="font-bold text-brand">{formatPrice(a.price)}</span>
                        <span className="flex items-center gap-0.5"><MapPin className="w-3 h-3" />{a.city}</span>
                      </div>
                    </div>
                    <Badge variant={STATUS_VARIANTS[a.status] ?? "neutral"}>
                      {STATUS_LABELS[a.status] ?? a.status}
                    </Badge>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {a.status === "DRAFT" && (
                        <form action={async () => { "use server"; await publishAnnonce(a.id); }}>
                          <button type="submit"
                            className="text-xs px-2.5 py-1.5 rounded-lg border border-brand text-brand hover:bg-primary-50 transition-colors font-medium">
                            Publier
                          </button>
                        </form>
                      )}
                      <a href={`/annonces/${a.id}`} target="_blank" rel="noopener noreferrer"
                        className="w-7 h-7 rounded-lg border border-border flex items-center justify-center text-text-secondary hover:text-brand hover:border-brand transition-colors">
                        <Eye className="w-3.5 h-3.5" />
                      </a>
                      <form action={async () => { "use server"; await deleteOwnAnnonce(a.id); }}>
                        <button type="submit"
                          className="w-7 h-7 rounded-lg border border-border flex items-center justify-center text-error hover:bg-error-light hover:border-error transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </form>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* ── Équipe ──────────────────────────────────────────── */}
      {tab === "equipe" && <ShopEquipe shopId={shop.id} members={members} />}

      {/* ── Abonnement ──────────────────────────────────────── */}
      {tab === "abonnement" && <ShopAbonnement shopId={shop.id} currentPlan={shop.subscription} />}

      {/* ── Paramètres ──────────────────────────────────────── */}
      {tab === "parametres" && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-border p-5">
            <LogoUpload shopId={shop.id} currentLogo={shop.logoUrl} shopName={shop.name} />
          </div>
          <ShopParametres shopId={shop.id} name={shop.name} description={shop.description} />
        </div>
      )}
    </div>
  );
}
