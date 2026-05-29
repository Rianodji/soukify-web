"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminPaginationProps {
  page: number;
  total: number;
  limit: number;
}

export function AdminPagination({ page, total, limit }: AdminPaginationProps) {
  const router = useRouter();
  const sp = useSearchParams();
  const [, startTransition] = useTransition();

  const totalPages = Math.ceil(total / limit);
  if (totalPages <= 1) return null;

  function goTo(p: number) {
    const params = new URLSearchParams(sp.toString());
    if (p <= 1) params.delete("page"); else params.set("page", String(p));
    startTransition(() => router.push(`?${params.toString()}`));
  }

  const delta = 2;
  const pages: number[] = [];
  for (let i = Math.max(1, page - delta); i <= Math.min(totalPages, page + delta); i++) {
    pages.push(i);
  }

  const btnBase = "w-8 h-8 rounded-lg border text-sm font-medium transition-colors flex items-center justify-center";
  const btnPage = cn(btnBase, "border-border text-text-secondary hover:bg-primary-50 hover:text-brand hover:border-brand");
  const btnActive = cn(btnBase, "border-brand bg-brand text-white");
  const btnNav = cn(btnBase, "border-border text-text-secondary hover:bg-primary-50 hover:text-brand disabled:opacity-40 disabled:pointer-events-none");

  return (
    <div className="flex items-center justify-between py-4 px-1">
      <p className="text-xs text-text-secondary">
        Page <span className="font-semibold text-text-primary">{page}</span> sur{" "}
        <span className="font-semibold text-text-primary">{totalPages}</span> —{" "}
        {total.toLocaleString("fr-FR")} résultat{total !== 1 ? "s" : ""}
      </p>

      <div className="flex items-center gap-1">
        <button type="button" onClick={() => goTo(page - 1)} disabled={page <= 1} className={btnNav}>
          <ChevronLeft className="w-4 h-4" />
        </button>

        {pages[0] > 1 && (
          <>
            <button type="button" onClick={() => goTo(1)} className={btnPage}>1</button>
            {pages[0] > 2 && <span className="text-text-disabled text-sm px-1">…</span>}
          </>
        )}

        {pages.map((p) => (
          <button key={p} type="button" onClick={() => goTo(p)} className={p === page ? btnActive : btnPage}>
            {p}
          </button>
        ))}

        {pages[pages.length - 1] < totalPages && (
          <>
            {pages[pages.length - 1] < totalPages - 1 && <span className="text-text-disabled text-sm px-1">…</span>}
            <button type="button" onClick={() => goTo(totalPages)} className={btnPage}>{totalPages}</button>
          </>
        )}

        <button type="button" onClick={() => goTo(page + 1)} disabled={page >= totalPages} className={btnNav}>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
