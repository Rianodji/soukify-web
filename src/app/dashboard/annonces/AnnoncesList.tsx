"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatPrice } from "@/lib/utils";
import { getAnnoncePriceXAF, getAnnonceImageUrl } from "@/lib/annonce";
import { Package, Plus, ArrowRight } from "lucide-react";
import { fetchMyAnnonces } from "../actions";
import { usePolledData } from "@/hooks/usePolledData";
import type { Annonce, PaginatedResponse } from "@/types/api";

const STATUS_COLORS: Record<string, "default" | "success" | "warning" | "error" | "neutral"> = {
  ACTIVE:   "success",
  DRAFT:    "warning",
  SOLD:     "neutral",
  EXPIRED:  "error",
  ARCHIVED: "neutral",
  DELETED:  "error",
};
const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Active", DRAFT: "Brouillon", SOLD: "Vendue", EXPIRED: "Expirée", ARCHIVED: "Archivée", DELETED: "Supprimée",
};

interface AnnoncesListProps {
  initialData: PaginatedResponse<Annonce>;
}

export function AnnoncesList({ initialData }: AnnoncesListProps) {
  const { data } = usePolledData("my-annonces", () => fetchMyAnnonces("limit=20"), initialData);
  const annonces = data?.items ?? [];
  const total = data?.total ?? 0;

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-text-primary">Mes annonces</h2>
          <p className="text-sm text-text-secondary mt-0.5">{total} annonce{total !== 1 ? "s" : ""}</p>
        </div>
        <Link href="/dashboard/annonces/new">
          <Button size="md" variant="gold">
            <Plus className="w-4 h-4" /> Nouvelle annonce
          </Button>
        </Link>
      </div>

      {annonces.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 bg-white rounded-2xl border border-border text-center">
          <Package className="w-12 h-12 text-border" />
          <div>
            <p className="font-medium text-text-primary">Aucune annonce publiée</p>
            <p className="text-sm text-text-secondary mt-1">Publiez votre première annonce gratuitement.</p>
          </div>
          <Link href="/dashboard/annonces/new">
            <Button variant="primary"><Plus className="w-4 h-4" /> Publier maintenant</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {annonces.map((a) => (
            <Link
              key={a.id}
              href={`/dashboard/annonces/${a.id}`}
              className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-border hover:border-brand hover:shadow-sm transition-all"
            >
              <div className="w-14 h-14 rounded-xl bg-primary-50 overflow-hidden shrink-0 flex items-center justify-center text-2xl">
                {getAnnonceImageUrl(a)
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={getAnnonceImageUrl(a)} alt="" className="w-full h-full object-cover" />
                  : "📦"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-text-primary truncate">{a.title}</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-sm font-bold text-brand">{formatPrice(getAnnoncePriceXAF(a))}</span>
                  <span className="text-xs text-text-secondary">{a.city}</span>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <Badge variant={STATUS_COLORS[a.status] ?? "neutral"}>
                  {STATUS_LABELS[a.status] ?? a.status}
                </Badge>
                <ArrowRight className="w-4 h-4 text-text-disabled" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
