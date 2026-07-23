import { unstable_rethrow } from "next/navigation";
import { serverGet } from "@/infrastructure/http/ApiServer";
import { formatPrice } from "@/lib/utils";
import {
  DollarSign, TrendingUp, ShoppingBag, Clock,
  ArrowUpRight, BarChart3, Percent,
} from "lucide-react";
import type { FinanceDashboard, AuditEntry, PaginatedResponse, PlatformConfig } from "@/types/api";

/* ── KPI Card ────────────────────────────────────────────── */
function KpiCard({ label, value, sub, icon: Icon, iconColor, iconBg, accent }: {
  label: string; value: string; sub?: string;
  icon: React.ElementType; iconColor: string; iconBg: string;
  accent?: boolean;
}) {
  return (
    <div className={`bg-white rounded-2xl border p-5 space-y-3 ${accent ? "border-gold ring-2 ring-gold/20" : "border-border"}`}>
      <div className="flex items-start justify-between">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${iconBg}`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
        {accent && (
          <span className="text-xs bg-gold text-white px-2 py-0.5 rounded-full font-semibold">Soukify</span>
        )}
      </div>
      <div>
        <p className="text-xs font-medium text-text-secondary uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold text-text-primary mt-1">{value}</p>
        {sub && <p className="text-xs text-text-disabled mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

/* ── Horizontal mini-bar ─────────────────────────────────── */
function MiniBar({ value, max, colorClass }: { value: number; max: number; colorClass: string }) {
  const pct = max > 0 ? Math.max(4, Math.round((value / max) * 100)) : 0;
  return (
    <div className="h-2 bg-border rounded-full overflow-hidden">
      <div className={`h-full rounded-full ${colorClass}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

/* ── Audit action labels ─────────────────────────────────── */
const AUDIT_LABELS: Record<string, { label: string; color: string }> = {
  ORDER_COMPLETED:   { label: "Commande complétée",  color: "bg-success-light text-success" },
  PAYMENT_RECEIVED:  { label: "Paiement reçu",        color: "bg-primary-100 text-brand" },
  PAYOUT_SENT:       { label: "Payout effectué",      color: "bg-accent-100 text-gold" },
  COMMISSION_EARNED: { label: "Commission générée",   color: "bg-accent-100 text-gold" },
  REFUND_ISSUED:     { label: "Remboursement émis",   color: "bg-error-light text-error" },
  DISPUTE_RESOLVED:  { label: "Litige résolu",        color: "bg-warning-light text-warning" },
};

export default async function AdminFinancePage() {
  const [dataRes, configRes, auditRes] = await Promise.allSettled([
    serverGet<FinanceDashboard>("/admin/finance/dashboard", 0),
    serverGet<PlatformConfig>("/admin/config", 0),
    serverGet<PaginatedResponse<AuditEntry>>("/admin/audit?limit=20", 0),
  ]);
  for (const r of [dataRes, configRes, auditRes]) if (r.status === "rejected") unstable_rethrow(r.reason);

  const data: Partial<FinanceDashboard> = dataRes.status === "fulfilled" ? dataRes.value : {};
  const config: Partial<PlatformConfig> = configRes.status === "fulfilled" ? configRes.value : {};
  const auditEntries: AuditEntry[] = auditRes.status === "fulfilled" ? auditRes.value.items : [];

  const gmv = data.totalRevenue ?? 0;
  const totalCommissions = data.totalCommissions ?? 0;
  const monthlyRevenue = data.monthlyRevenue ?? 0;
  const monthlyCommissions = data.monthlyCommissions ?? 0;
  const pendingPayouts = data.pendingPayouts ?? 0;
  const completedOrders = data.completedOrders ?? 0;
  const commissionRate = config.commissionRatePct ?? 0;
  const revenueByMonth = data.revenueByMonth ?? [];

  // Commission rate implied by actual data
  const effectiveRate = gmv > 0 ? ((totalCommissions / gmv) * 100).toFixed(1) : commissionRate.toFixed(1);

  // Max revenue for bar scaling
  const maxMonthlyRevenue = revenueByMonth.length > 0
    ? Math.max(...revenueByMonth.map((r) => r.revenue))
    : 0;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-6xl mx-auto">

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold text-text-primary">Finance</h2>
          <p className="text-sm text-text-secondary mt-0.5">Dashboard financier de la plateforme</p>
        </div>
        {/* Commission rate badge */}
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent-100 border border-accent-200">
          <Percent className="w-4 h-4 text-gold" />
          <span className="text-sm font-semibold text-amber-800">
            Taux de commission : <span className="text-gold">{commissionRate}%</span>
          </span>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="GMV total"
          value={formatPrice(gmv)}
          sub={`Ce mois : ${formatPrice(monthlyRevenue)}`}
          icon={TrendingUp} iconColor="text-brand" iconBg="bg-primary-50"
        />
        <KpiCard
          label="Commissions totales"
          value={formatPrice(totalCommissions)}
          sub={`Ce mois : ${formatPrice(monthlyCommissions)}`}
          icon={DollarSign} iconColor="text-gold" iconBg="bg-accent-100"
          accent
        />
        <KpiCard
          label="Payouts en attente"
          value={formatPrice(pendingPayouts)}
          sub="À décaisser aux vendeurs"
          icon={Clock}
          iconColor={pendingPayouts > 0 ? "text-warning" : "text-text-disabled"}
          iconBg={pendingPayouts > 0 ? "bg-warning-light" : "bg-border"}
        />
        <KpiCard
          label="Commandes complétées"
          value={completedOrders.toLocaleString("fr-FR")}
          sub={completedOrders > 0 ? `~${formatPrice(Math.round(gmv / completedOrders))} / commande` : undefined}
          icon={ShoppingBag} iconColor="text-success" iconBg="bg-success-light"
        />
      </div>

      {/* Revenue split + monthly chart */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-6">

        {/* Commission split */}
        <div className="bg-white rounded-2xl border border-border p-5 space-y-5">
          <h3 className="font-semibold text-text-primary flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-text-disabled" />
            Répartition du GMV
          </h3>

          {gmv > 0 ? (
            <div className="space-y-5">
              {/* Stacked bar */}
              <div>
                <div className="h-6 rounded-full overflow-hidden flex">
                  <div
                    className="h-full bg-primary-400 transition-all"
                    style={{ width: `${((gmv - totalCommissions) / gmv) * 100}%` }}
                  />
                  <div
                    className="h-full bg-gold transition-all"
                    style={{ width: `${(totalCommissions / gmv) * 100}%` }}
                  />
                </div>
                <div className="flex items-center gap-4 mt-2 text-xs">
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-primary-400 inline-block" /> Vendeurs</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-gold inline-block" /> Soukify</span>
                </div>
              </div>

              <div className="space-y-3">
                {[
                  { label: "Part vendeurs",       value: gmv - totalCommissions, pct: ((gmv - totalCommissions) / gmv * 100).toFixed(1), color: "text-brand" },
                  { label: "Commissions Soukify", value: totalCommissions,        pct: (totalCommissions / gmv * 100).toFixed(1),          color: "text-gold" },
                ].map(({ label, value, pct, color }) => (
                  <div key={label} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div>
                      <p className="text-sm font-medium text-text-primary">{label}</p>
                      <p className={`text-xs font-semibold ${color}`}>{pct}% du GMV</p>
                    </div>
                    <p className={`text-sm font-bold ${color}`}>{formatPrice(value)}</p>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-border">
                <div className="flex items-center justify-between text-xs text-text-secondary">
                  <span>Taux effectif constaté</span>
                  <span className="font-semibold text-text-primary">{effectiveRate}%</span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-text-disabled py-6 text-center">
              Aucune transaction enregistrée
            </p>
          )}
        </div>

        {/* Monthly table with bars */}
        <div className="bg-white rounded-2xl border border-border overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h3 className="font-semibold text-text-primary">Revenus mensuels</h3>
            {revenueByMonth.length > 0 && (
              <span className="text-xs text-text-disabled">{revenueByMonth.length} mois</span>
            )}
          </div>

          {revenueByMonth.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-background">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase">Mois</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-text-secondary uppercase">GMV</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-text-secondary uppercase">Commission</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-text-secondary uppercase">Taux</th>
                    <th className="px-4 py-3 w-32"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {revenueByMonth.map((row) => (
                    <tr key={row.month} className="hover:bg-background transition-colors">
                      <td className="px-4 py-3 font-medium text-text-primary whitespace-nowrap">{row.month}</td>
                      <td className="px-4 py-3 text-right text-brand font-semibold whitespace-nowrap">{formatPrice(row.revenue)}</td>
                      <td className="px-4 py-3 text-right text-gold font-semibold whitespace-nowrap">{formatPrice(row.commission)}</td>
                      <td className="px-4 py-3 text-right text-text-secondary text-xs whitespace-nowrap">
                        {row.revenue > 0 ? `${((row.commission / row.revenue) * 100).toFixed(1)}%` : "—"}
                      </td>
                      <td className="px-4 py-3 w-32">
                        <MiniBar value={row.revenue} max={maxMonthlyRevenue} colorClass="bg-brand" />
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-border bg-primary-50">
                    <td className="px-4 py-3 font-bold text-text-primary text-xs uppercase tracking-wide">Total</td>
                    <td className="px-4 py-3 text-right font-bold text-brand">{formatPrice(gmv)}</td>
                    <td className="px-4 py-3 text-right font-bold text-gold">{formatPrice(totalCommissions)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-text-secondary text-xs">
                      {gmv > 0 ? `${effectiveRate}%` : "—"}
                    </td>
                    <td className="px-4 py-3" />
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-text-disabled">
              <BarChart3 className="w-10 h-10" />
              <p className="text-sm">Aucune donnée mensuelle disponible</p>
            </div>
          )}
        </div>
      </div>

      {/* Payout alert */}
      {pendingPayouts > 0 && (
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-warning-light border border-warning">
          <Clock className="w-5 h-5 text-warning shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-text-primary">Payouts en attente de décaissement</p>
            <p className="text-sm text-text-secondary mt-0.5">
              <span className="font-bold text-warning">{formatPrice(pendingPayouts)}</span> sont à verser aux vendeurs dont les commandes ont été complétées.
            </p>
          </div>
        </div>
      )}

      {/* Transaction log */}
      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="font-semibold text-text-primary">Journal des transactions</h3>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <span className="text-xs text-text-secondary">Temps réel</span>
          </div>
        </div>

        {auditEntries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-text-disabled">
            <ArrowUpRight className="w-10 h-10" />
            <p className="text-sm">Aucune transaction récente</p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {auditEntries.map((entry) => {
              const conf = AUDIT_LABELS[entry.action];
              return (
                <li key={entry.id} className="px-5 py-3.5 flex items-center gap-4">
                  <div className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${conf?.color ?? "bg-border text-text-secondary"}`}>
                    {conf?.label ?? entry.action}
                  </div>
                  <div className="flex-1 min-w-0">
                    {entry.details && (
                      <p className="text-sm text-text-primary truncate">{entry.details}</p>
                    )}
                    {entry.adminName && (
                      <p className="text-xs text-text-disabled">Par {entry.adminName}</p>
                    )}
                  </div>
                  <span className="text-xs text-text-disabled whitespace-nowrap">
                    {new Date(entry.createdAt).toLocaleDateString("fr-FR", {
                      day: "2-digit", month: "short", year: "numeric",
                    })}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
