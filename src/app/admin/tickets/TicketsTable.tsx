"use client";

import { Suspense } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Ticket, ExternalLink } from "lucide-react";
import { TicketActions } from "./TicketActions";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { fetchAdminTickets, type AdminTicketsData } from "../actions";
import { usePolledData } from "@/hooks/usePolledData";

const STATUS_CONFIG: Record<string, { label: string; variant: "error" | "warning" | "success" | "neutral" }> = {
  OPEN:        { label: "Ouvert",   variant: "error" },
  IN_PROGRESS: { label: "En cours", variant: "warning" },
  RESOLVED:    { label: "Résolu",   variant: "success" },
  CLOSED:      { label: "Fermé",    variant: "neutral" },
};

/** Real enum is `NORMAL | URGENT` only (confirmed against domain code, cf. HANDOFF_INFRA.md). */
const PRIORITY_CONFIG: Record<string, { label: string; variant: "error" | "neutral" }> = {
  URGENT: { label: "Urgent", variant: "error" },
  NORMAL: { label: "Normal", variant: "neutral" },
};

interface TicketsTableProps {
  qs: string;
  page: number;
  limit: number;
  initialData: AdminTicketsData;
  currentUserId?: string;
  hasStatusFilter: boolean;
}

export function TicketsTable({ qs, page, limit, initialData, currentUserId, hasStatusFilter }: TicketsTableProps) {
  const { data } = usePolledData(
    ["admin-tickets", qs],
    () => fetchAdminTickets(qs),
    initialData,
  );

  const tickets = data?.items ?? [];
  const total = data?.total ?? 0;
  const userNames = data?.userNames ?? {};
  const openCount = !hasStatusFilter ? tickets.filter((t) => t.status === "OPEN").length : 0;

  return (
    <>
      <p className="text-sm text-text-secondary -mt-2">
        {total.toLocaleString("fr-FR")} ticket{total !== 1 ? "s" : ""}
        {openCount > 0 && <span className="ml-2 text-error font-medium">· {openCount} ouvert{openCount > 1 ? "s" : ""}</span>}
      </p>

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
                  const isAssignedToMe = !!ticket.assigneeId && ticket.assigneeId === currentUserId;
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
                      <td className="px-4 py-3 text-text-secondary whitespace-nowrap">{ticket.reporterId ? (userNames[ticket.reporterId] ?? `#${ticket.reporterId.slice(0, 8)}`) : "—"}</td>
                      <td className="px-4 py-3"><Badge variant={priority.variant}>{priority.label}</Badge></td>
                      <td className="px-4 py-3"><Badge variant={status.variant}>{status.label}</Badge></td>
                      <td className="px-4 py-3 text-xs whitespace-nowrap">
                        {ticket.assigneeId ? (
                          <span className={isAssignedToMe ? "text-brand font-medium" : "text-text-secondary"}>
                            {isAssignedToMe ? "Moi" : (userNames[ticket.assigneeId] ?? `#${ticket.assigneeId.slice(0, 8)}`)}
                          </span>
                        ) : (
                          <span className="italic text-text-disabled">Non assigné</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-text-secondary text-xs whitespace-nowrap">
                        {new Date(ticket.createdAt).toLocaleDateString("fr-FR")}
                      </td>
                      <td className="px-4 py-3">
                        <TicketActions ticketId={ticket.id} status={ticket.status} isAssigned={!!ticket.assigneeId} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-4 border-t border-border">
            <Suspense fallback={null}>
              <AdminPagination page={page} total={total} limit={limit} />
            </Suspense>
          </div>
        </div>
      )}
    </>
  );
}
