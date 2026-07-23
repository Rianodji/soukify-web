import { Suspense } from "react";
import { unstable_rethrow } from "next/navigation";
import { AdminFilterBar } from "@/components/admin/AdminFilterBar";
import { AnnoncesTable } from "./AnnoncesTable";
import { fetchAdminAnnonces } from "../actions";
import type { Annonce, PaginatedResponse } from "@/types/api";

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

  const qsString = qs.toString();

  let initialData: PaginatedResponse<Annonce> = { items: [], total: 0 };
  try {
    initialData = await fetchAdminAnnonces(qsString);
  } catch (e) { unstable_rethrow(e); /* AnnoncesTable handles the empty state */ }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-5 max-w-7xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-text-primary">Annonces</h2>
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

      <AnnoncesTable qs={qsString} page={page} limit={LIMIT} initialData={initialData} />
    </div>
  );
}
