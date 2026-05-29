import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Clock, Shield, Phone, Calendar, User } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { serverGet } from "@/infrastructure/http/ApiServer";
import { getSession } from "@/lib/session";
import { formatPhoneDisplay } from "@/lib/utils";
import { TicketDetailActions } from "./TicketDetailActions";
import type { Ticket } from "@/types/api";

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

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `il y a ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `il y a ${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `il y a ${days}j`;
}

interface TicketDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function TicketDetailPage({ params }: TicketDetailPageProps) {
  const { id } = await params;

  let ticket: Ticket | null = null;
  const session = await getSession();

  try {
    ticket = await serverGet<Ticket>(`/admin/tickets/${id}`, 0);
  } catch { /* handled below */ }

  if (!ticket) notFound();

  const status   = STATUS_CONFIG[ticket.status]   ?? { label: ticket.status,   variant: "neutral" as const };
  const priority = PRIORITY_CONFIG[ticket.priority] ?? { label: ticket.priority, variant: "neutral" as const };
  const isAssignedToMe = ticket.assignee?.id === session?.userId;
  const isAssigned = !!ticket.assignee;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      {/* Back */}
      <Link
        href="/admin/tickets"
        className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-brand transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        Retour aux tickets
      </Link>

      {/* Header card */}
      <div className="bg-white rounded-2xl border border-border p-6 space-y-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant={priority.variant}>{priority.label}</Badge>
            <Badge variant={status.variant}>{status.label}</Badge>
          </div>
          <div className="flex items-center gap-2 text-xs text-text-disabled">
            <Clock className="w-3.5 h-3.5" />
            {timeAgo(ticket.createdAt)}
            <span>·</span>
            <span>Mis à jour {timeAgo(ticket.updatedAt)}</span>
          </div>
        </div>

        <h1 className="text-xl font-bold text-text-primary leading-snug">
          {ticket.subject}
        </h1>

        <div className="flex items-center gap-3 text-sm text-text-secondary">
          <span>
            Ouvert par{" "}
            <span className="font-medium text-text-primary">{ticket.user?.name ?? "—"}</span>
          </span>
          <span>·</span>
          <span>{new Date(ticket.createdAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}</span>
          {ticket.assignee && (
            <>
              <span>·</span>
              <span>
                Assigné à{" "}
                <span className={`font-medium ${isAssignedToMe ? "text-brand" : "text-text-primary"}`}>
                  {isAssignedToMe ? "vous" : ticket.assignee.name}
                </span>
              </span>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
        {/* Left: description */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-border p-6 space-y-3">
            <h2 className="font-semibold text-text-primary">Description</h2>
            {ticket.description ? (
              <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">
                {ticket.description}
              </p>
            ) : (
              <p className="text-sm text-text-disabled italic">Aucune description fournie.</p>
            )}
          </div>
        </div>

        {/* Right: user info + actions */}
        <div className="space-y-4">
          {/* Actions */}
          <div className="bg-white rounded-2xl border border-border p-5 space-y-3">
            <h2 className="font-semibold text-text-primary text-sm">Actions</h2>
            <TicketDetailActions
              ticketId={ticket.id}
              status={ticket.status}
              isAssigned={isAssigned}
            />
            {isAssignedToMe && status.label !== "Résolu" && (
              <p className="text-xs text-brand text-center">Ce ticket vous est assigné</p>
            )}
          </div>

          {/* User info */}
          {ticket.user && (
            <div className="bg-white rounded-2xl border border-border p-5 space-y-4">
              <h2 className="font-semibold text-text-primary text-sm">Utilisateur</h2>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-brand flex items-center justify-center text-white font-bold shrink-0">
                  {ticket.user.name?.[0]?.toUpperCase() ?? "?"}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-text-primary text-sm truncate">{ticket.user.name}</p>
                  {ticket.user.isKycVerified && (
                    <span className="flex items-center gap-1 text-xs text-success">
                      <Shield className="w-3 h-3" /> Identité vérifiée
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-text-secondary">
                  <Phone className="w-3.5 h-3.5 text-text-disabled shrink-0" />
                  <span className="font-mono">{formatPhoneDisplay(ticket.user.phoneNumber)}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-text-secondary">
                  <Calendar className="w-3.5 h-3.5 text-text-disabled shrink-0" />
                  <span>Inscrit le {new Date(ticket.user.createdAt).toLocaleDateString("fr-FR")}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-text-secondary">
                  <User className="w-3.5 h-3.5 text-text-disabled shrink-0" />
                  <span>{ticket.user.roles.join(", ")}</span>
                </div>
              </div>

              <Link
                href={`/admin/users?q=${encodeURIComponent(ticket.user.phoneNumber)}`}
                className="block text-center text-xs text-brand hover:underline"
              >
                Voir le profil admin →
              </Link>
            </div>
          )}

          {/* Ticket meta */}
          <div className="bg-background rounded-2xl border border-border p-4 space-y-2">
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Informations</p>
            <dl className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <dt className="text-text-disabled">ID</dt>
                <dd className="font-mono text-text-secondary">{ticket.id.slice(0, 12)}…</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-text-disabled">Créé</dt>
                <dd className="text-text-secondary">{new Date(ticket.createdAt).toLocaleString("fr-FR")}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-text-disabled">Mis à jour</dt>
                <dd className="text-text-secondary">{new Date(ticket.updatedAt).toLocaleString("fr-FR")}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
