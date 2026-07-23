import { serverGet } from "@/infrastructure/http/ApiServer";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { Settings2, AlertTriangle, Clock } from "lucide-react";
import { ConfigForm } from "./ConfigForm";
import type { PlatformConfig, AuditEntry, PaginatedResponse } from "@/types/api";

const DEFAULT_CONFIG: PlatformConfig = {
  commissionRatePct:   10,
  freeMaxAnnonces:     10,
  standardMaxAnnonces: 100,
  premiumMaxAnnonces:  1000,
};

export default async function AdminConfigPage() {
  const session = await getSession();
  if (!session?.roles.includes("SUPER_ADMIN")) redirect("/admin");

  let config: PlatformConfig = DEFAULT_CONFIG;
  let configHistory: AuditEntry[] = [];
  let fetchError: string | null = null;

  await Promise.allSettled([
    serverGet<PlatformConfig>("/admin/config", 0)
      .then((r) => { config = r; })
      .catch((e: unknown) => {
        fetchError = e instanceof Error ? e.message : "Impossible de charger la configuration.";
      }),
    serverGet<PaginatedResponse<AuditEntry>>("/admin/audit?action=CONFIG_UPDATED&limit=5", 0)
      .then((r) => { configHistory = r.data; }),
  ]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-accent-100 flex items-center justify-center">
          <Settings2 className="w-5 h-5 text-gold" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-text-primary">Configuration plateforme</h2>
          <p className="text-sm text-text-secondary">Accès réservé aux Super Admins</p>
        </div>
      </div>

      {fetchError && (
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-warning-light border border-warning">
          <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-800">API indisponible</p>
            <p className="text-xs text-amber-700 mt-0.5">{fetchError} — Valeurs par défaut affichées.</p>
          </div>
        </div>
      )}

      {/* Form */}
      <ConfigForm config={config} />

      {/* Warning */}
      <div className="flex items-start gap-3 p-4 rounded-2xl bg-warning-light border border-warning">
        <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-sm font-semibold text-text-primary">Impact des modifications</p>
          <ul className="text-xs text-text-secondary space-y-0.5">
            <li>• Le taux de commission s'applique aux <strong>nouvelles commandes uniquement</strong>.</li>
            <li>• Les limites d'annonces prennent effet <strong>immédiatement</strong> pour les nouveaux plans.</li>
            <li>• Les vendeurs existants conservent leur quota actuel jusqu'au renouvellement.</li>
          </ul>
        </div>
      </div>

      {/* Change history */}
      {configHistory.length > 0 && (
        <div className="bg-white rounded-2xl border border-border overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center gap-2">
            <Clock className="w-4 h-4 text-text-disabled" />
            <h3 className="font-semibold text-text-primary text-sm">Historique des modifications</h3>
          </div>
          <ul className="divide-y divide-border">
            {configHistory.map((entry) => (
              <li key={entry.id} className="px-5 py-3 flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-gold mt-2 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-text-primary">
                    Configuration modifiée
                    {entry.adminName && <span className="text-text-disabled"> par {entry.adminName}</span>}
                  </p>
                  {entry.details && <p className="text-xs text-text-disabled">{entry.details}</p>}
                </div>
                <span className="text-xs text-text-disabled whitespace-nowrap">
                  {new Date(entry.createdAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
