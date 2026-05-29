import { Suspense } from "react";
import Link from "next/link";
import { serverGet } from "@/infrastructure/http/ApiServer";
import { getSession } from "@/lib/session";
import { Badge } from "@/components/ui/Badge";
import { Ticket, ExternalLink } from "lucide-react";
import { TicketActions } from "./TicketActions";
import { NewTicketButton } from "./NewTicketButton";
import { AdminFilterBar } from "@/components/admin/AdminFilterBar";
import { AdminPagination } from "@/components/admin/AdminPagination";
import type { Ticket as TicketType, PaginatedResponse } from "@/types/api";

const STATUS_CONFIG: Record<string, { label: string; variant: "error" | "warning" | "success" | "neutral" }> = {
  OPEN:        { label: "Ouvert",   variant: "error" },
  IN_PROGRESS: { label: "En cours", variant: "warning" },
  RESOLVED:    { label: "Résolu",   variant: "success" },
  CLOSED:      { label: "Fermé",    variant: "neutral" },
};

const PRIORITY_CONFIG: Record<string, { label: string; variant: "error" | "warning" | "default" | "neutral" }> = {
  URGENT: { label: "Urgent", variant: "error" },
  HIGH:   { label: "Élevé",  variant: "warning" },
  MEDIUM: { label: "Moyen",  variant: "default" },
  LOW:    { label: "Faible", variant: "neutral" },
};

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

  let tickets: TicketType[] = [];
  let total = 0;

  try {
    const res = await serverGet<PaginatedResponse<TicketType>>(`/admin/tickets?${qs}`, 0);
    tickets = res.items;
    total = res.total;
  } catch { /* handled below */ }

  const openCount = !sp.status ? tickets.filter((t) => t.status === "OPEN").length : 0;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-5 max-w-7xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-text-primary">Tickets support</h2>
          <p className="text-sm text-text-secondary mt-0.5">
            {total.toLocaleString("fr-FR")} ticket{total !== 1 ? "s" : ""}
            {openCount > 0 && <span className="ml-2 text-error font-medium">· {openCount} ouvert{openCount > 1 ? "s" : ""}</span>}
          </p>
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

      {tickets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 bg-white rounded-2xl border border-border">
          <Ticket className="w-12 h-12 text-border" />
          <p className="text-text-secondary">Aucun ticket trouvé.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-background">
                  {["Sujet", "Utilisateur", "Priorité", "Statut", "Assigné à", "Date", "Actions"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {tickets.map((ticket) => {
                  const status   = STATUS_CONFIG[ticket.status]     ?? { label: ticket.status,   variant: "neutral" as const };
                  const priority = PRIORITY_CONFIG[ticket.priority] ?? { label: ticket.priority, variant: "neutral" as const };
                  const isAssignedToMe = ticket.assignee?.id === session?.userId;
                  return (
                    <tr
                      key={ticket.id}
                      className={`hover:bg-background transition-colors
                        ${ticket.status === "OPEN" && ticket.priority === "URGENT" ? "bg-error-light/10" : ""}`}
                    >
                      <td className="px-4 py-3 max-w-[240px]">
                        <Link href={`/admin/tickets/${ticket.id}`} className="group">
                          <p className="font-medium text-text-primary truncate group-hover:text-brand transition-colors flex items-center gap-1.5">
                            {ticket.subject}
                            <ExternalLink className="w-3 h-3 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </p>
                          {ticket.description && (
                            <p className="text-xs text-text-disabled truncate mt-0.5">{ticket.description}</p>
                          )}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-text-secondary whitespace-nowrap">{ticket.user?.name ?? "—"}</td>
                      <td className="px-4 py-3"><Badge variant={priority.variant}>{priority.label}</Badge></td>
                      <td className="px-4 py-3"><Badge variant={status.variant}>{status.label}</Badge></td>
                      <td className="px-4 py-3 text-xs whitespace-nowrap">
                        {ticket.assignee ? (
                          <span className={isAssignedToMe ? "text-brand font-medium" : "text-text-secondary"}>
                            {isAssignedToMe ? "Moi" : ticket.assignee.name}
                          </span>
                        ) : (
                          <span className="italic text-text-disabled">Non assigné</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-text-secondary text-xs whitespace-nowrap">
                        {new Date(ticket.createdAt).toLocaleDateString("fr-FR")}
                      </td>
                      <td className="px-4 py-3">
                        <TicketActions ticketId={ticket.id} status={ticket.status} isAssigned={isAssigned(ticket)} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-4 border-t border-border">
            <Suspense fallback={null}>
              <AdminPagination page={page} total={total} limit={LIMIT} />
            </Suspense>
          </div>
        </div>
      )}
    </div>
  );
}

function isAssigned(ticket: TicketType): boolean {
  return !!ticket.assignee;
}
