import { Suspense } from "react";
import Link from "next/link";
import { serverGet } from "@/infrastructure/http/ApiServer";
import { Badge } from "@/components/ui/Badge";
import { formatPrice } from "@/lib/utils";
import { Package } from "lucide-react";
import { AnnonceActions } from "./AnnonceActions";
import { AdminFilterBar } from "@/components/admin/AdminFilterBar";
import { AdminPagination } from "@/components/admin/AdminPagination";
import type { Annonce, PaginatedResponse } from "@/types/api";

const STATUS_CONFIG: Record<string, { label: string; variant: "success" | "warning" | "error" | "neutral" | "default" }> = {
  ACTIVE:  { label: "Active",    variant: "success" },
  DRAFT:   { label: "Brouillon", variant: "warning" },
  SOLD:    { label: "Vendue",    variant: "neutral" },
  EXPIRED: { label: "Expirée",   variant: "error" },
  DELETED: { label: "Supprimée", variant: "error" },
};

const LIMIT = 25;

interface AnnoncesPageProps {
  searchParams: Promise<Record<string, string>>;
}

export default async function AdminAnnoncesPage({ searchParams }: AnnoncesPageProps) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? 1));

  const qs = new URLSearchParams();
  qs.set("limit", String(LIMIT));
  qs.set("offset", String((page - 1) * LIMIT));
  if (sp.q)       qs.set("q", sp.q);
  if (sp.status)  qs.set("status", sp.status);
  if (sp.type)    qs.set("type", sp.type);

  let annonces: Annonce[] = [];
  let total = 0;

  try {
    const res = await serverGet<PaginatedResponse<Annonce>>(`/search/annonces?${qs}`, 0);
    annonces = res.data;
    total = res.total;
  } catch { /* handled below */ }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-5 max-w-7xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-text-primary">Annonces</h2>
        <p className="text-sm text-text-secondary mt-0.5">{total.toLocaleString("fr-FR")} annonce{total !== 1 ? "s" : ""}</p>
      </div>

      <Suspense fallback={null}>
        <AdminFilterBar
          searchPlaceholder="Titre de l'annonce…"
          filters={[
            {
              key: "status",
              placeholder: "Tous les statuts",
              options: [
                { value: "ACTIVE",  label: "Actives" },
                { value: "DRAFT",   label: "Brouillons" },
                { value: "SOLD",    label: "Vendues" },
                { value: "EXPIRED", label: "Expirées" },
                { value: "DELETED", label: "Supprimées" },
              ],
            },
            {
              key: "type",
              placeholder: "Tous les types",
              options: [
                { value: "SALE",    label: "Vente" },
                { value: "SERVICE", label: "Service" },
              ],
            },
          ]}
        />
      </Suspense>

      {annonces.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 bg-white rounded-2xl border border-border">
          <Package className="w-12 h-12 text-border" />
          <p className="text-text-secondary">Aucune annonce trouvée.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-background">
                  {["Annonce", "Vendeur", "Type", "Prix", "Ville", "Statut", "Date", "Actions"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {annonces.map((a) => {
                  const status = STATUS_CONFIG[a.status] ?? { label: a.status, variant: "neutral" as const };
                  return (
                    <tr key={a.id} className="hover:bg-background transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {a.images?.[0] ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={a.images[0]} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center shrink-0">
                              <Package className="w-5 h-5 text-brand" />
                            </div>
                          )}
                          <span className="font-medium text-text-primary truncate max-w-[180px]">{a.title}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 max-w-[130px]">
                        {a.seller ? (
                          <Link href={`/admin/users/${a.seller.id}`}
                            className="text-sm text-text-secondary hover:text-brand transition-colors truncate block">
                            {a.seller.name}
                          </Link>
                        ) : (
                          <span className="text-text-disabled text-sm">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline">{a.type === "SALE" ? "Vente" : "Service"}</Badge>
                      </td>
                      <td className="px-4 py-3 font-semibold text-brand whitespace-nowrap">{formatPrice(a.price)}</td>
                      <td className="px-4 py-3 text-text-secondary whitespace-nowrap">{a.city}</td>
                      <td className="px-4 py-3">
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </td>
                      <td className="px-4 py-3 text-text-secondary text-xs whitespace-nowrap">
                        {new Date(a.createdAt).toLocaleDateString("fr-FR")}
                      </td>
                      <td className="px-4 py-3">
                        <AnnonceActions annonceId={a.id} />
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
