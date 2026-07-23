import { Suspense } from "react";
import { unstable_rethrow } from "next/navigation";
import { getSession } from "@/lib/session";
import { NewTicketButton } from "./NewTicketButton";
import { AdminFilterBar } from "@/components/admin/AdminFilterBar";
import { TicketsTable } from "./TicketsTable";
import { fetchAdminTickets } from "../actions";
import type { Ticket as TicketType, PaginatedResponse } from "@/types/api";

const LIMIT = 25;

interface TicketsPageProps {
  searchParams: Promise<Record<string, string>>;
}

export default async function AdminTicketsPage({ searchParams }: TicketsPageProps) {
  const [sp, session] = await Promise.all([searchParams, getSession()]);
  const page = Math.max(1, Number(sp.page ?? 1));

  const qs = new URLSearchParams();
  qs.set("limit", String(LIMIT));
  qs.set("offset", String((page - 1) * LIMIT));
  if (sp.status)   qs.set("status",   sp.status);
  if (sp.priority) qs.set("priority", sp.priority);

  const qsString = qs.toString();

  let initialData: PaginatedResponse<TicketType> = { items: [], total: 0 };
  try {
    initialData = await fetchAdminTickets(qsString);
  } catch (e) { unstable_rethrow(e); /* TicketsTable handles the empty state */ }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-5 max-w-7xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-text-primary">Tickets support</h2>
        </div>
        <Suspense fallback={null}>
          <NewTicketButton />
        </Suspense>
      </div>

      <Suspense fallback={null}>
        <AdminFilterBar
          filters={[
            {
              key: "status",
              placeholder: "Tous les statuts",
              options: [
                { value: "OPEN",        label: "Ouverts" },
                { value: "IN_PROGRESS", label: "En cours" },
                { value: "RESOLVED",    label: "Résolus" },
                { value: "CLOSED",      label: "Fermés" },
              ],
            },
            {
              key: "priority",
              placeholder: "Toutes les priorités",
              options: [
                { value: "URGENT", label: "Urgent" },
                { value: "HIGH",   label: "Élevé" },
                { value: "MEDIUM", label: "Moyen" },
                { value: "LOW",    label: "Faible" },
              ],
            },
          ]}
        />
      </Suspense>

      <TicketsTable
        qs={qsString}
        page={page}
        limit={LIMIT}
        initialData={initialData}
        currentUserId={session?.userId}
        hasStatusFilter={!!sp.status}
      />
    </div>
  );
}
