import { Suspense } from "react";
import Link from "next/link";
import { serverGet } from "@/infrastructure/http/ApiServer";
import { Badge } from "@/components/ui/Badge";
import { Store, ExternalLink } from "lucide-react";
import { ShopActions } from "./ShopActions";
import { AdminFilterBar } from "@/components/admin/AdminFilterBar";
import { AdminPagination } from "@/components/admin/AdminPagination";
import type { Shop, PaginatedResponse } from "@/types/api";

const STATUS_CONFIG: Record<string, { label: string; variant: "warning" | "success" | "error" | "neutral" }> = {
  PENDING:   { label: "En attente", variant: "warning" },
  APPROVED:  { label: "Approuvée",  variant: "success" },
  REJECTED:  { label: "Rejetée",    variant: "error" },
  SUSPENDED: { label: "Suspendue",  variant: "error" },
};

const SUB_CONFIG: Record<string, { label: string; variant: "neutral" | "default" | "gold" }> = {
  FREE:     { label: "Gratuit",  variant: "neutral" },
  STANDARD: { label: "Standard", variant: "default" },
  PREMIUM:  { label: "Premium",  variant: "gold" },
};

const LIMIT = 25;

interface ShopsPageProps {
  searchParams: Promise<Record<string, string>>;
}

export default async function AdminShopsPage({ searchParams }: ShopsPageProps) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? 1));

  const qs = new URLSearchParams();
  qs.set("limit", String(LIMIT));
  qs.set("offset", String((page - 1) * LIMIT));
  if (sp.q)       qs.set("q", sp.q);
  if (sp.status)  qs.set("status", sp.status);
  if (sp.plan)    qs.set("subscription", sp.plan);

  let shops: Shop[] = [];
  let total = 0;

  try {
    const res = await serverGet<PaginatedResponse<Shop>>(`/admin/shops?${qs}`, 0);
    shops = res.items;
    total = res.total;
  } catch { /* handled below */ }

  const pendingCount = shops.filter((s) => s.status === "PENDING").length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-5 max-w-7xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-text-primary">Boutiques Pro</h2>
          <p className="text-sm text-text-secondary mt-0.5">
            {total.toLocaleString("fr-FR")} boutique{total !== 1 ? "s" : ""}
            {pendingCount > 0 && (
              <span className="ml-2 inline-flex items-center gap-1 text-warning font-medium">
                · {pendingCount} en attente
              </span>
            )}
          </p>
        </div>
      </div>

      <Suspense fallback={null}>
        <AdminFilterBar
          searchPlaceholder="Nom de la boutique…"
          filters={[
            {
              key: "status",
              placeholder: "Tous les statuts",
              options: [
                { value: "PENDING",   label: "En attente" },
                { value: "APPROVED",  label: "Approuvées" },
                { value: "REJECTED",  label: "Rejetées" },
                { value: "SUSPENDED", label: "Suspendues" },
              ],
            },
            {
              key: "plan",
              placeholder: "Tous les plans",
              options: [
                { value: "FREE",     label: "Gratuit" },
                { value: "STANDARD", label: "Standard" },
                { value: "PREMIUM",  label: "Premium" },
              ],
            },
          ]}
        />
      </Suspense>

      {shops.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 bg-white rounded-2xl border border-border">
          <Store className="w-12 h-12 text-border" />
          <p className="text-text-secondary">Aucune boutique trouvée.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-background">
                  {["Boutique", "Propriétaire", "Plan", "Statut", "Créée le", "Actions"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {shops.map((shop) => {
                  const status = STATUS_CONFIG[shop.status] ?? { label: shop.status, variant: "neutral" as const };
                  const sub    = SUB_CONFIG[shop.subscription] ?? { label: shop.subscription, variant: "neutral" as const };
                  return (
                    <tr key={shop.id} className={`hover:bg-background transition-colors ${shop.status === "PENDING" ? "bg-warning-light/20" : ""}`}>
                      <td className="px-4 py-3">
                        <Link href={`/admin/shops/${shop.id}`} className="flex items-center gap-3 group">
                          {shop.logoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={shop.logoUrl} alt="" className="w-9 h-9 rounded-lg object-cover shrink-0" />
                          ) : (
                            <div className="w-9 h-9 rounded-lg bg-primary-50 flex items-center justify-center shrink-0">
                              <Store className="w-4 h-4 text-brand" />
                            </div>
                          )}
                          <span className="font-medium text-text-primary group-hover:text-brand transition-colors flex items-center gap-1.5">
                            {shop.name}
                            <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                          </span>
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-text-secondary">{shop.owner?.name ?? "—"}</td>
                      <td className="px-4 py-3"><Badge variant={sub.variant}>{sub.label}</Badge></td>
                      <td className="px-4 py-3"><Badge variant={status.variant}>{status.label}</Badge></td>
                      <td className="px-4 py-3 text-text-secondary text-xs whitespace-nowrap">
                        {new Date(shop.createdAt).toLocaleDateString("fr-FR")}
                      </td>
                      <td className="px-4 py-3">
                        <ShopActions shopId={shop.id} status={shop.status} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-4 border-t border-border">
            <Suspense fallback={null}>
              <AdminPagination page={page} total={total} limit={LIMIT} />
            </Suspense>
          </div>
        </div>
      )}
    </div>
  );
}
