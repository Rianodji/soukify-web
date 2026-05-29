"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition, useRef } from "react";
import { Search, X } from "lucide-react";

export interface SelectFilter {
  key: string;
  placeholder: string;
  options: Array<{ value: string; label: string }>;
}

interface AdminFilterBarProps {
  searchPlaceholder?: string;
  filters?: SelectFilter[];
}

export function AdminFilterBar({ searchPlaceholder, filters }: AdminFilterBarProps) {
  const router = useRouter();
  const sp = useSearchParams();
  const [, startTransition] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  function update(key: string, value: string) {
    const params = new URLSearchParams(sp.toString());
    if (value) params.set(key, value); else params.delete(key);
    params.delete("page");
    startTransition(() => router.push(`?${params.toString()}`));
  }

  function handleSearch(value: string) {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => update("q", value), 380);
  }

  const activeCount =
    (sp.get("q") ? 1 : 0) +
    (filters?.filter((f) => sp.has(f.key)).length ?? 0);

  return (
    <div className="flex flex-wrap items-center gap-3">
      {searchPlaceholder && (
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-disabled pointer-events-none" />
          <input
            type="search"
            defaultValue={sp.get("q") ?? ""}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full h-9 pl-9 pr-3 rounded-lg border border-border text-sm bg-white text-text-primary placeholder:text-text-disabled focus:outline-none focus:border-brand transition-colors"
          />
        </div>
      )}

      {filters?.map((f) => (
        <select
          key={f.key}
          value={sp.get(f.key) ?? ""}
          onChange={(e) => update(f.key, e.target.value)}
          className="h-9 px-3 rounded-lg border border-border text-sm bg-white text-text-primary focus:outline-none focus:border-brand transition-colors cursor-pointer"
        >
          <option value="">{f.placeholder}</option>
          {f.options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      ))}

      {activeCount > 0 && (
        <button
          type="button"
          onClick={() => { startTransition(() => { router.push("?"); }); }}
          className="h-9 px-3 flex items-center gap-1.5 rounded-lg border border-error text-error text-sm hover:bg-error-light transition-colors"
        >
          <X className="w-3.5 h-3.5" />
          Effacer ({activeCount})
        </button>
      )}
    </div>
  );
}
