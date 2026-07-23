import { Suspense } from "react";
import { serverGet } from "@/infrastructure/http/ApiServer";
import { Badge } from "@/components/ui/Badge";
import { Flag, ExternalLink, Shield } from "lucide-react";
import { ReportActions } from "./ReportActions";
import { AdminFilterBar } from "@/components/admin/AdminFilterBar";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { formatPhoneDisplay } from "@/lib/utils";
import type { Report, PaginatedResponse } from "@/types/api";

const STATUS_CONFIG: Record<string, { label: string; variant: "warning" | "error" | "neutral" }> = {
  PENDING:   { label: "En attente", variant: "warning" },
  APPROVED:  { label: "Traité",     variant: "error" },
  DISMISSED: { label: "Ignoré",     variant: "neutral" },
};

const REASON_LABELS: Record<string, { label: string; color: string }> = {
  SPAM:          { label: "Spam",                 color: "bg-border text-text-secondary" },
  FRAUD:         { label: "Fraude",               color: "bg-error-light text-error" },
  INAPPROPRIATE: { label: "Contenu inapproprié",  color: "bg-warning-light text-warning" },
  FAKE:          { label: "Annonce factice",       color: "bg-warning-light text-warning" },
  OTHER:         { label: "Autre",                color: "bg-border text-text-secondary" },
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

  let reports: Report[] = [];
  let total = 0;

  try {
    const res = await serverGet<PaginatedResponse<Report>>(`/admin/reports?${qs}`, 0);
    reports = res.items;
    total = res.total;
  } catch { /* handled below */ }

  const pendingCount = !sp.status ? reports.filter((r) => r.status === "PENDING").length : 0;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-5 max-w-7xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-text-primary">Signalements</h2>
        <p className="text-sm text-text-secondary mt-0.5">
          {total.toLocaleString("fr-FR")} signalement{total !== 1 ? "s" : ""}
          {pendingCount > 0 && <span className="ml-2 text-warning font-medium">· {pendingCount} en attente</span>}
        </p>
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

      {reports.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 bg-white rounded-2xl border border-border">
          <Flag className="w-12 h-12 text-border" />
          <p className="text-text-secondary">Aucun signalement trouvé.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => {
            const status = STATUS_CONFIG[report.status] ?? { label: report.status, variant: "neutral" as const };
            const reason = REASON_LABELS[report.reason] ?? { label: report.reason, color: "bg-border text-text-secondary" };

            return (
              <div
                key={report.id}
                className={`bg-white rounded-2xl border transition-colors ${report.status === "PENDING" ? "border-warning/50" : "border-border"}`}
              >
                {/* Header row */}
                <div className="flex items-start justify-between gap-4 px-5 pt-4 pb-3 border-b border-border">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${reason.color}`}>
                      {reason.label}
                    </span>
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </div>
                  <span className="text-xs text-text-disabled whitespace-nowrap">
                    {new Date(report.createdAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-4 px-5 py-4 items-start">
                  {/* Description */}
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Motif détaillé</p>
                    {report.description ? (
                      <p className="text-sm text-text-primary leading-relaxed">{report.description}</p>
                    ) : (
                      <p className="text-sm text-text-disabled italic">Aucune précision fournie</p>
                    )}

                    {/* Annonce signalée */}
                    {(report.annonce || report.annonceId) && (
                      <div className="mt-2 pt-2 border-t border-border">
                        <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-1">Annonce signalée</p>
                        {report.annonce ? (
                          <a
                            href={`/annonces/${report.annonceId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-sm text-brand hover:underline"
                          >
                            <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">{report.annonce.title}</span>
                          </a>
                        ) : (
                          <span className="text-sm text-text-disabled font-mono">#{report.annonceId?.slice(0, 12)}</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Rapporteur */}
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Rapporteur</p>
                    {report.reporter ? (
                      <div className="flex items-start gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-brand flex items-center justify-center text-white text-xs font-bold shrink-0">
                          {report.reporter.name?.[0]?.toUpperCase() ?? "?"}
                        </div>
                        <div className="min-w-0 space-y-0.5">
                          <p className="text-sm font-medium text-text-primary">{report.reporter.name}</p>
                          <p className="text-xs text-text-secondary font-mono">
                            {formatPhoneDisplay(report.reporter.phoneNumber)}
                          </p>
                          {report.reporter.isKycVerified && (
                            <span className="inline-flex items-center gap-1 text-xs text-success">
                              <Shield className="w-3 h-3" /> KYC vérifié
                            </span>
                          )}
                          <p className="text-xs text-text-disabled">
                            Inscrit le {new Date(report.reporter.createdAt).toLocaleDateString("fr-FR")}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-text-disabled">—</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="sm:text-right">
                    <ReportActions reportId={report.id} status={report.status} />
                  </div>
                </div>
              </div>
            );
          })}

          <div className="bg-white rounded-2xl border border-border px-4">
            <Suspense fallback={null}>
              <AdminPagination page={page} total={total} limit={LIMIT} />
            </Suspense>
          </div>
        </div>
      )}
    </div>
  );
}
