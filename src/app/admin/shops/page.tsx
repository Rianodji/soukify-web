import { Suspense } from "react";
import { unstable_rethrow } from "next/navigation";
import { AdminFilterBar } from "@/components/admin/AdminFilterBar";
import { ShopsTable } from "./ShopsTable";
import { fetchAdminShops } from "../actions";
import type { Shop, PaginatedResponse } from "@/types/api";

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

  const qsString = qs.toString();

  let initialData: PaginatedResponse<Shop> = { items: [], total: 0 };
  try {
    initialData = await fetchAdminShops(qsString);
  } catch (e) { unstable_rethrow(e); /* ShopsTable handles the empty state */ }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-5 max-w-7xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-text-primary">Boutiques Pro</h2>
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
                { value: "ACTIVE",    label: "Approuvées" },
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

      <ShopsTable qs={qsString} page={page} limit={LIMIT} initialData={initialData} />
    </div>
  );
}
