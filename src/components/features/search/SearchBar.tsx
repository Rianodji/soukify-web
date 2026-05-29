"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, MapPin, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { CHAD_CITIES } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  size?: "md" | "lg";
  defaultQuery?: string;
  defaultCity?: string;
}

export function SearchBar({ size = "md", defaultQuery = "", defaultCity = "" }: SearchBarProps) {
  const router = useRouter();
  const [query, setQuery] = useState(defaultQuery);
  const [city, setCity] = useState(defaultCity);
  const [cityOpen, setCityOpen] = useState(false);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (city) params.set("city", city);
    router.push(`/search?${params.toString()}`);
  }

  const isLg = size === "lg";

  return (
    <form
      onSubmit={handleSearch}
      className={cn(
        "flex items-center w-full bg-white border-2 border-white rounded-2xl overflow-hidden",
        "shadow-xl focus-within:shadow-2xl transition-shadow duration-200",
        isLg ? "h-16" : "h-12",
      )}
    >
      {/* Search field */}
      <div className="flex items-center flex-1 px-4 gap-3 min-w-0">
        <Search className={cn("text-text-disabled shrink-0", isLg ? "w-5 h-5" : "w-4 h-4")} />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={isLg ? "Que recherchez-vous ?" : "Rechercher…"}
          autoComplete="off"
          className={cn(
            "flex-1 bg-transparent outline-none text-text-primary placeholder:text-text-disabled min-w-0 truncate",
            isLg ? "text-base" : "text-sm",
          )}
        />
      </div>

      {/* City selector */}
      <div className="hidden sm:flex relative">
        <button
          type="button"
          onClick={() => setCityOpen((o) => !o)}
          className={cn(
            "flex items-center gap-1.5 px-4 border-l border-border text-text-secondary hover:text-text-primary transition-colors whitespace-nowrap",
            isLg ? "h-16 text-sm" : "h-12 text-xs",
          )}
        >
          <MapPin className="w-3.5 h-3.5 text-brand" />
          {city || "Toutes les villes"}
          <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", cityOpen && "rotate-180")} />
        </button>

        {cityOpen && (
          <div className="absolute top-full left-0 mt-1 w-52 bg-white border border-border rounded-xl shadow-xl z-50 py-1 max-h-60 overflow-y-auto animate-fade-in">
            <button
              type="button"
              onClick={() => { setCity(""); setCityOpen(false); }}
              className="w-full text-left px-4 py-2 text-sm text-text-secondary hover:bg-primary-50 hover:text-brand transition-colors"
            >
              Toutes les villes
            </button>
            {CHAD_CITIES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => { setCity(c); setCityOpen(false); }}
                className={cn(
                  "w-full text-left px-4 py-2 text-sm hover:bg-primary-50 hover:text-brand transition-colors",
                  city === c ? "text-brand font-medium bg-primary-50" : "text-text-primary",
                )}
              >
                {c}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Submit button */}
      <div className={cn("px-2", isLg ? "pr-3" : "pr-2")}>
        <Button
          type="submit"
          size={isLg ? "md" : "sm"}
          className="rounded-xl"
        >
          <Search className="w-4 h-4 sm:hidden" />
          <span className="hidden sm:inline">Rechercher</span>
        </Button>
      </div>
    </form>
  );
}
