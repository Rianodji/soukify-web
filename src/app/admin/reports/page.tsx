import { Suspense } from "react";
import { unstable_rethrow } from "next/navigation";
import { AdminFilterBar } from "@/components/admin/AdminFilterBar";
import { ReportsList } from "./ReportsList";
import { fetchAdminReports } from "../actions";
import type { Report, PaginatedResponse } from "@/types/api";

const REASON_LABELS: Record<string, { label: string }> = {
  SPAM:          { label: "Spam" },
  FRAUD:         { label: "Fraude" },
  INAPPROPRIATE: { label: "Contenu inapproprié" },
  FAKE:          { label: "Annonce factice" },
  OTHER:         { label: "Autre" },
};

const LIMIT = 25;

interface ReportsPageProps {
  searchParams: Promise<Record<string, string>>;
}

export default async function AdminReportsPage({ searchParams }: ReportsPageProps) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? 1));

  const qs = new URLSearchParams();
  qs.set("limit", String(LIMIT));
  qs.set("offset", String((page - 1) * LIMIT));
  if (sp.status) qs.set("status", sp.status);
  if (sp.reason) qs.set("reason", sp.reason);

  const qsString = qs.toString();

  let initialData: PaginatedResponse<Report> = { items: [], total: 0 };
  try {
    initialData = await fetchAdminReports(qsString);
  } catch (e) { unstable_rethrow(e); /* ReportsList handles the empty state */ }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-5 max-w-7xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-text-primary">Signalements</h2>
      </div>

      <Suspense fallback={null}>
        <AdminFilterBar
          filters={[
            {
              key: "status",
              placeholder: "Tous les statuts",
              options: [
                { value: "PENDING",   label: "En attente" },
                { value: "APPROVED",  label: "Traités" },
                { value: "DISMISSED", label: "Ignorés" },
              ],
            },
            {
              key: "reason",
              placeholder: "Tous les motifs",
              options: Object.entries(REASON_LABELS).map(([v, { label }]) => ({ value: v, label })),
            },
          ]}
        />
      </Suspense>

      <ReportsList qs={qsString} page={page} limit={LIMIT} initialData={initialData} hasStatusFilter={!!sp.status} />
    </div>
  );
}
