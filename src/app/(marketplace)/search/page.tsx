import { Suspense } from "react";
import { SearchFilters } from "./SearchFilters";
import { AnnonceCard, AnnonceCardSkeleton } from "@/components/features/annonces/AnnonceCard";
import { SearchBar } from "@/components/features/search/SearchBar";
import { Package } from "lucide-react";
import type { Annonce, PaginatedResponse } from "@/types/api";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3020/api/v1";

async function fetchAnnonces(params: Record<string, string>): Promise<{ items: Annonce[]; total: number }> {
  const qs = new URLSearchParams();
  qs.set("limit", "24");
  qs.set("status", "ACTIVE");
  if (params.q)           qs.set("q", params.q);
  if (params.city)        qs.set("city", params.city);
  if (params.categoryId)  qs.set("categoryId", params.categoryId);
  if (params.condition)   qs.set("condition", params.condition);
  if (params.type)        qs.set("type", params.type);
  if (params.minPrice)    qs.set("minPrice", params.minPrice);
  if (params.maxPrice)    qs.set("maxPrice", params.maxPrice);

  try {
    const res = await fetch(`${API_BASE}/search/annonces?${qs.toString()}`, {
      next: { revalidate: 30 },
    });
    if (!res.ok) return { items: [], total: 0 };
    const body = await res.json() as { data: PaginatedResponse<Annonce> };
    return { items: body.data?.items ?? [], total: body.data?.total ?? 0 };
  } catch {
    return { items: [], total: 0 };
  }
}

function ResultsSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
      {Array.from({ length: 12 }).map((_, i) => <AnnonceCardSkeleton key={i} />)}
    </div>
  );
}

async function Results({ params }: { params: Record<string, string> }) {
  const { items, total } = await fetchAnnonces(params);
  const hasQuery = params.q || params.categoryId || params.city || params.condition;

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="w-16 h-16 rounded-2xl bg-primary-50 flex items-center justify-center">
          <Package className="w-8 h-8 text-primary-300" />
        </div>
        <div className="text-center space-y-1">
          <p className="font-semibold text-text-primary">
            {hasQuery ? "Aucune annonce trouvée" : "Aucune annonce disponible"}
          </p>
          <p className="text-sm text-text-secondary">
            {hasQuery ? "Essayez avec d'autres mots-clés ou filtres." : "Revenez bientôt."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-text-secondary">
        <span className="font-semibold text-text-primary">{total.toLocaleString("fr-FR")}</span> annonce{total !== 1 ? "s" : ""}
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
        {items.map((a) => <AnnonceCard key={a.id} annonce={a} />)}
      </div>
    </div>
  );
}

interface SearchPageProps {
  searchParams: Promise<Record<string, string>>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const { q = "", city = "" } = params;

  const title = q
    ? `Résultats pour "${q}"`
    : "Toutes les annonces";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-4">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-bold text-text-primary">{title}</h1>
        {city && <p className="text-sm text-text-secondary mt-0.5">à {city}</p>}
      </div>

      {/* Mobile search bar */}
      <div className="md:hidden">
        <SearchBar size="md" defaultQuery={q} defaultCity={city} />
      </div>

      <div className="flex gap-6 items-start">
        {/* Filters (sidebar desktop / drawer mobile) */}
        <Suspense fallback={null}>
          <SearchFilters />
        </Suspense>

        {/* Results */}
        <div className="flex-1 min-w-0">
          <Suspense fallback={<ResultsSkeleton />}>
            <Results params={params} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
