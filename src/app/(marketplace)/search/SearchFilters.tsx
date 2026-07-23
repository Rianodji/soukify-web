"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition, useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { CHAD_CITIES, ANNONCE_CONDITIONS, CATEGORY_STYLE, DEFAULT_CATEGORY_STYLE } from "@/lib/constants";
import type { Category } from "@/types/api";

interface SearchFiltersProps {
  categories: Category[];
}

export function SearchFilters({ categories }: SearchFiltersProps) {
  const router = useRouter();
  const sp = useSearchParams();
  const [, startTransition] = useTransition();
  const [mobileOpen, setMobileOpen] = useState(false);

  const current = {
    q:          sp.get("q") ?? "",
    city:       sp.get("city") ?? "",
    categoryId: sp.get("categoryId") ?? "",
    minPrice:   sp.get("minPrice") ?? "",
    maxPrice:   sp.get("maxPrice") ?? "",
    condition:  sp.get("condition") ?? "",
    type:       sp.get("type") ?? "",
  };

  function update(key: string, value: string) {
    const params = new URLSearchParams(sp.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    startTransition(() => router.push(`/search?${params.toString()}`));
  }

  function clearAll() {
    const params = new URLSearchParams();
    if (current.q) params.set("q", current.q);
    startTransition(() => router.push(`/search?${params.toString()}`));
  }

  const activeFilters = [current.city, current.categoryId, current.condition, current.type, current.minPrice, current.maxPrice]
    .filter(Boolean).length;

  const filterContent = (
    <div className="space-y-6">
      {/* Catégories */}
      <div>
        <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-3">
          Catégorie
        </p>
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => update("categoryId", "")}
            className={cn(
              "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors text-left",
              !current.categoryId ? "bg-brand text-white font-medium" : "text-text-secondary hover:bg-primary-50 hover:text-brand"
            )}
          >
            Toutes les catégories
          </button>
          {categories.map((cat) => {
            const style = CATEGORY_STYLE[cat.slug] ?? DEFAULT_CATEGORY_STYLE;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => update("categoryId", cat.id)}
                className={cn(
                  "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors text-left",
                  current.categoryId === cat.id
                    ? "bg-brand text-white font-medium"
                    : "text-text-secondary hover:bg-primary-50 hover:text-brand"
                )}
              >
                <span>{cat.icon ?? style.icon}</span>
                {cat.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Type */}
      <div>
        <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-3">Type</p>
        <div className="flex gap-2">
          {[{ v: "", l: "Tout" }, { v: "SALE", l: "Vente" }, { v: "SERVICE", l: "Service" }].map(({ v, l }) => (
            <button
              key={v}
              type="button"
              onClick={() => update("type", v)}
              className={cn(
                "flex-1 py-1.5 rounded-lg text-xs font-medium border transition-colors",
                current.type === v
                  ? "bg-brand text-white border-brand"
                  : "border-border text-text-secondary hover:border-brand hover:text-brand"
              )}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* État */}
      <div>
        <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-3">État</p>
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => update("condition", "")}
            className={cn(
              "w-full flex items-center px-3 py-2 rounded-lg text-sm transition-colors text-left",
              !current.condition ? "bg-brand text-white font-medium" : "text-text-secondary hover:bg-primary-50 hover:text-brand"
            )}
          >
            Tous les états
          </button>
          {Object.entries(ANNONCE_CONDITIONS).map(([k, label]) => (
            <button
              key={k}
              type="button"
              onClick={() => update("condition", k)}
              className={cn(
                "w-full flex items-center px-3 py-2 rounded-lg text-sm transition-colors text-left",
                current.condition === k
                  ? "bg-brand text-white font-medium"
                  : "text-text-secondary hover:bg-primary-50 hover:text-brand"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Prix */}
      <div>
        <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-3">Prix (XAF)</p>
        <div className="flex gap-2 items-center">
          <input
            type="number"
            placeholder="Min"
            defaultValue={current.minPrice}
            onBlur={(e) => update("minPrice", e.target.value)}
            className="w-full h-9 px-3 rounded-lg border border-border text-sm bg-white text-text-primary placeholder:text-text-disabled focus:outline-none focus:border-brand"
          />
          <span className="text-text-disabled text-sm shrink-0">—</span>
          <input
            type="number"
            placeholder="Max"
            defaultValue={current.maxPrice}
            onBlur={(e) => update("maxPrice", e.target.value)}
            className="w-full h-9 px-3 rounded-lg border border-border text-sm bg-white text-text-primary placeholder:text-text-disabled focus:outline-none focus:border-brand"
          />
        </div>
      </div>

      {/* Ville */}
      <div>
        <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-3">Ville</p>
        <select
          value={current.city}
          onChange={(e) => update("city", e.target.value)}
          className="w-full h-9 px-3 rounded-lg border border-border text-sm bg-white text-text-primary focus:outline-none focus:border-brand"
        >
          <option value="">Toutes les villes</option>
          {CHAD_CITIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Clear */}
      {activeFilters > 0 && (
        <button
          type="button"
          onClick={clearAll}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-error text-error text-sm hover:bg-error-light transition-colors"
        >
          <X className="w-3.5 h-3.5" />
          Effacer les filtres ({activeFilters})
        </button>
      )}
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <div className="lg:hidden mb-4">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setMobileOpen(true)}
          className="gap-2"
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filtres
          {activeFilters > 0 && (
            <span className="w-5 h-5 rounded-full bg-brand text-white text-xs flex items-center justify-center font-bold">
              {activeFilters}
            </span>
          )}
        </Button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 z-50 w-80 bg-white shadow-xl overflow-y-auto lg:hidden">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <p className="font-semibold text-text-primary">Filtres</p>
              <button type="button" onClick={() => setMobileOpen(false)} className="text-text-secondary hover:text-text-primary">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">
              {filterContent}
              <Button className="w-full mt-4" onClick={() => setMobileOpen(false)}>
                Voir les résultats
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-56 shrink-0">
        <div className="sticky top-24 bg-white rounded-2xl border border-border p-4">
          {filterContent}
        </div>
      </aside>
    </>
  );
}
