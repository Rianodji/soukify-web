"use client";

import { Suspense } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { formatPrice } from "@/lib/utils";
import { Package } from "lucide-react";
import { AnnonceActions } from "./AnnonceActions";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { fetchAdminAnnonces } from "../actions";
import { usePolledData } from "@/hooks/usePolledData";
import { getAnnoncePriceXAF, getAnnonceImageUrl } from "@/lib/annonce";
import type { PaginatedResponse, Annonce } from "@/types/api";

const STATUS_CONFIG: Record<string, { label: string; variant: "success" | "warning" | "error" | "neutral" | "default" }> = {
  ACTIVE:  { label: "Active",    variant: "success" },
  DRAFT:   { label: "Brouillon", variant: "warning" },
  SOLD:    { label: "Vendue",    variant: "neutral" },
  EXPIRED: { label: "Expirée",   variant: "error" },
  DELETED: { label: "Supprimée", variant: "error" },
};

interface AnnoncesTableProps {
  qs: string;
  page: number;
  limit: number;
  initialData: PaginatedResponse<Annonce>;
}

export function AnnoncesTable({ qs, page, limit, initialData }: AnnoncesTableProps) {
  const { data } = usePolledData(
    ["admin-annonces", qs],
    () => fetchAdminAnnonces(qs),
    initialData,
  );

  const annonces = data?.items ?? [];
  const total = data?.total ?? 0;

  return (
    <>
      <p className="text-sm text-text-secondary -mt-2">{total.toLocaleString("fr-FR")} annonce{total !== 1 ? "s" : ""}</p>

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
                          {getAnnonceImageUrl(a) ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={getAnnonceImageUrl(a)} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center shrink-0">
                              <Package className="w-5 h-5 text-brand" />
                            </div>
                          )}
                          <span className="font-medium text-text-primary truncate max-w-[180px]">{a.title}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 max-w-[130px]">
                        {a.sellerId ? (
                          <Link href={`/admin/users/${a.sellerId}`}
                            className="text-sm text-text-secondary hover:text-brand transition-colors truncate block">
                            {a.seller?.displayName ?? `#${a.sellerId.slice(0, 8)}`}
                          </Link>
                        ) : (
                          <span className="text-text-disabled text-sm">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline">{a.type === "SALE" ? "Vente" : "Service"}</Badge>
                      </td>
                      <td className="px-4 py-3 font-semibold text-brand whitespace-nowrap">{formatPrice(getAnnoncePriceXAF(a))}</td>
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
              <AdminPagination page={page} total={total} limit={limit} />
            </Suspense>
          </div>
        </div>
      )}
    </>
  );
}
