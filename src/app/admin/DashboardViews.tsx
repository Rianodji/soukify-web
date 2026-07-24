"use client";

import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import {
  Users, Package, ShoppingBag, DollarSign,
  TrendingUp, AlertCircle, Clock, Flag, Shield, FileCheck,
  ArrowRight, BarChart3, Store, CheckCircle,
} from "lucide-react";
import { usePolledData } from "@/hooks/usePolledData";
import {
  fetchFinanceDashboardData, fetchSupportDashboardData,
  fetchAccountManagerDashboardData, fetchFullAdminDashboardData,
  type FinanceDashboardData, type SupportDashboardData,
  type AccountManagerDashboardData, type FullAdminDashboardData,
} from "./actions";
import type { AuditEntry } from "@/types/api";

/* ── Shared stat card ────────────────────────────────────── */
function StatCard({ label, value, sub, icon: Icon, iconColor, iconBg, href }: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; iconColor: string; iconBg: string; href?: string;
}) {
  const inner = (
    <div className={`bg-white rounded-2xl border p-5 flex items-start gap-4 transition-all
      ${href ? "hover:border-brand hover:shadow-sm cursor-pointer border-border" : "border-border"}`}>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
        <Icon className={`w-6 h-6 ${iconColor}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-text-secondary uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold text-text-primary mt-0.5">{value}</p>
        {sub && <p className="text-xs text-text-disabled mt-0.5">{sub}</p>}
      </div>
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

const AUDIT_LABELS: Record<string, string> = {
  USER_SUSPENDED:   "Utilisateur suspendu",
  USER_UNSUSPENDED: "Utilisateur réactivé",
  KYC_APPROVED:     "KYC approuvé",
  KYC_REJECTED:     "KYC rejeté",
  SHOP_APPROVED:    "Boutique approuvée",
  SHOP_REJECTED:    "Boutique rejetée",
  SHOP_SUSPENDED:   "Boutique suspendue",
  TICKET_RESOLVED:  "Ticket résolu",
  REPORT_APPROVED:  "Signalement traité",
  REPORT_DISMISSED: "Signalement ignoré",
  CONFIG_UPDATED:   "Configuration modifiée",
  ORDER_COMPLETED:  "Commande complétée",
  PAYMENT_RECEIVED: "Paiement reçu",
  PAYOUT_SENT:      "Payout effectué",
};

function AuditList({ entries }: { entries: AuditEntry[] }) {
  if (entries.length === 0) {
    return <div className="flex items-center justify-center py-10 text-sm text-text-disabled">Aucune activité récente</div>;
  }
  return (
    <ul className="divide-y divide-border">
      {entries.map((entry) => (
        <li key={entry.id} className="px-5 py-3 flex items-start gap-3">
          <div className="w-1.5 h-1.5 rounded-full bg-brand mt-2 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-text-primary">
              {AUDIT_LABELS[entry.action] ?? entry.action}
              {entry.adminName && <span className="text-text-disabled"> — {entry.adminName}</span>}
            </p>
            {entry.details && <p className="text-xs text-text-disabled truncate">{entry.details}</p>}
          </div>
          <span className="text-xs text-text-disabled shrink-0">
            {new Date(entry.createdAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}
          </span>
        </li>
      ))}
    </ul>
  );
}

/* ── Finance-only dashboard ──────────────────────────────── */
export function FinanceDashboardView({ initialData }: { initialData: FinanceDashboardData }) {
  const { data } = usePolledData("finance-dashboard", fetchFinanceDashboardData, initialData);
  const { finance, config, auditEntries } = data ?? initialData;

  const commissionPct = config.commissionRatePct ?? 0;
  const gmv = finance.totalRevenue ?? 0;
  const commissions = finance.totalCommissions ?? 0;
  const pendingPayouts = finance.pendingPayouts ?? 0;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">Vue d'ensemble</h2>
          <p className="text-sm text-text-secondary mt-1">Dashboard financier Soukify</p>
        </div>
        <Link
          href="/admin/finance"
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand text-white text-sm font-medium hover:bg-brand-hover transition-colors"
        >
          <BarChart3 className="w-4 h-4" />
          Rapport complet
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Commission rate banner */}
      <div className="flex items-center gap-4 p-4 rounded-2xl bg-accent-100 border border-accent-200">
        <div className="w-10 h-10 rounded-xl bg-gold flex items-center justify-center shrink-0">
          <DollarSign className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-amber-900">Taux de commission actuel</p>
          <p className="text-xs text-amber-700 mt-0.5">
            Chaque commande complétée génère <strong>{commissionPct}%</strong> de commission pour Soukify.
          </p>
        </div>
        <p className="text-3xl font-bold text-gold">{commissionPct}%</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Revenus du mois"
          value={formatPrice(finance.monthlyRevenue ?? 0)}
          sub={`GMV total : ${formatPrice(gmv)}`}
          icon={TrendingUp} iconColor="text-brand" iconBg="bg-primary-50"
          href="/admin/finance"
        />
        <StatCard
          label="Commissions du mois"
          value={formatPrice(finance.monthlyCommissions ?? 0)}
          sub={`Total : ${formatPrice(commissions)}`}
          icon={DollarSign} iconColor="text-gold" iconBg="bg-accent-100"
          href="/admin/finance"
        />
        <StatCard
          label="Payouts en attente"
          value={formatPrice(pendingPayouts)}
          sub="À verser aux vendeurs"
          icon={Clock}
          iconColor={pendingPayouts > 0 ? "text-warning" : "text-text-disabled"}
          iconBg={pendingPayouts > 0 ? "bg-warning-light" : "bg-border"}
          href="/admin/finance"
        />
        <StatCard
          label="Commandes complétées"
          value={(finance.completedOrders ?? 0).toLocaleString("fr-FR")}
          icon={ShoppingBag} iconColor="text-success" iconBg="bg-success-light"
        />
      </div>

      {/* Payouts alert */}
      {pendingPayouts > 0 && (
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-warning-light border border-warning">
          <AlertCircle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-text-primary">Payouts en attente</p>
            <p className="text-sm text-text-secondary mt-0.5">
              <span className="font-bold text-warning">{formatPrice(pendingPayouts)}</span> sont à décaisser vers les vendeurs.
            </p>
          </div>
          <Link href="/admin/finance" className="text-sm text-brand font-medium hover:underline whitespace-nowrap">
            Voir le détail →
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Commission split visual */}
        <div className="bg-white rounded-2xl border border-border p-5 space-y-4">
          <h3 className="font-semibold text-text-primary">Répartition des revenus totaux</h3>
          {gmv > 0 ? (
            <div className="space-y-4">
              {[
                { label: "Part vendeurs", value: gmv - commissions, color: "bg-primary-300", textColor: "text-brand" },
                { label: "Commissions Soukify", value: commissions, color: "bg-gold", textColor: "text-gold" },
              ].map(({ label, value, color, textColor }) => {
                const pct = gmv > 0 ? Math.round((value / gmv) * 100) : 0;
                return (
                  <div key={label} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-text-secondary">{label}</span>
                      <span className={`font-semibold ${textColor}`}>{formatPrice(value)}</span>
                    </div>
                    <div className="h-3 bg-border rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${color}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="text-xs text-text-disabled text-right">{pct}% du GMV</p>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-text-disabled py-4 text-center">Aucune donnée disponible</p>
          )}
        </div>

        {/* Audit financier récent */}
        <div className="bg-white rounded-2xl border border-border overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h3 className="font-semibold text-text-primary">Activité récente</h3>
            <Link href="/admin/finance" className="text-xs text-brand hover:underline">Tout voir</Link>
          </div>
          <AuditList entries={auditEntries} />
        </div>
      </div>
    </div>
  );
}

/* ── Support-only dashboard ──────────────────────────────── */
export function SupportDashboardView({ initialData, currentUserId }: { initialData: SupportDashboardData; currentUserId?: string }) {
  const { data } = usePolledData(
    ["support-dashboard", currentUserId ?? ""],
    () => fetchSupportDashboardData(currentUserId),
    initialData,
  );
  const { urgentCount, normalCount, pendingReports, myTickets, userNames, auditEntries } = data ?? initialData;

  const totalOpen = urgentCount + normalCount;
  const maxCount = Math.max(urgentCount, normalCount, 1);

  const priorities = [
    { label: "Urgent", count: urgentCount, color: "bg-error",  text: "text-error",         badge: "bg-error-light text-error" },
    { label: "Normal", count: normalCount, color: "bg-border", text: "text-text-disabled", badge: "bg-border text-text-secondary" },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-5xl mx-auto">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">Vue d'ensemble</h2>
          <p className="text-sm text-text-secondary mt-1">Dashboard support client</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/tickets" className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand text-white text-sm font-medium hover:bg-brand-hover transition-colors">
            <Clock className="w-4 h-4" /> Tickets
            {totalOpen > 0 && <span className="ml-1 bg-white/20 text-white text-xs font-bold px-1.5 rounded-full">{totalOpen}</span>}
          </Link>
          <Link href="/admin/reports" className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-text-secondary text-sm font-medium hover:border-brand hover:text-brand transition-colors">
            <Flag className="w-4 h-4" /> Signalements
            {pendingReports > 0 && <span className="ml-1 bg-warning text-white text-xs font-bold px-1.5 rounded-full">{pendingReports}</span>}
          </Link>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Tickets ouverts" value={totalOpen}
          icon={Clock} iconColor={totalOpen > 0 ? "text-error" : "text-text-disabled"}
          iconBg={totalOpen > 0 ? "bg-error-light" : "bg-border"} href="/admin/tickets?status=OPEN" />
        <StatCard label="Urgents" value={urgentCount}
          icon={AlertCircle} iconColor={urgentCount > 0 ? "text-error" : "text-text-disabled"}
          iconBg={urgentCount > 0 ? "bg-error-light" : "bg-border"} href="/admin/tickets?status=OPEN&priority=URGENT" />
        <StatCard label="Signalements en attente" value={pendingReports}
          icon={Flag} iconColor={pendingReports > 0 ? "text-warning" : "text-text-disabled"}
          iconBg={pendingReports > 0 ? "bg-warning-light" : "bg-border"} href="/admin/reports?status=PENDING" />
        <StatCard label="Mes tickets assignés" value={myTickets.length}
          icon={Shield} iconColor="text-brand" iconBg="bg-primary-50"
          href={currentUserId ? `/admin/tickets?assigneeId=${currentUserId}` : "/admin/tickets"} />
      </div>

      {/* Urgents alert */}
      {urgentCount > 0 && (
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-error-light border border-error">
          <AlertCircle className="w-5 h-5 text-error shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-text-primary">
              {urgentCount} ticket{urgentCount > 1 ? "s" : ""} urgent{urgentCount > 1 ? "s" : ""} en attente
            </p>
            <p className="text-xs text-text-secondary mt-0.5">Ces tickets nécessitent une réponse immédiate.</p>
          </div>
          <Link href="/admin/tickets?status=OPEN&priority=URGENT" className="text-sm text-error font-semibold hover:underline whitespace-nowrap">
            Traiter →
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Priority breakdown */}
        <div className="bg-white rounded-2xl border border-border p-5 space-y-4">
          <h3 className="font-semibold text-text-primary">File d'attente par priorité</h3>
          {totalOpen === 0 ? (
            <p className="text-sm text-text-disabled py-4 text-center">Aucun ticket ouvert 🎉</p>
          ) : (
            <div className="space-y-3">
              {priorities.map(({ label, count, color, text }) => (
                <div key={label} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-text-secondary">{label}</span>
                    <span className={`text-sm font-bold ${text}`}>{count}</span>
                  </div>
                  <div className="h-2.5 bg-border rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${color}`}
                      style={{ width: `${Math.round((count / maxCount) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="pt-2 border-t border-border">
            <Link href="/admin/tickets?status=OPEN" className="text-sm text-brand hover:underline flex items-center gap-1">
              Voir tous les tickets ouverts <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* My assigned tickets */}
        <div className="bg-white rounded-2xl border border-border overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h3 className="font-semibold text-text-primary">Mes tickets assignés</h3>
            <Link href="/admin/tickets" className="text-xs text-brand hover:underline">Tous les tickets</Link>
          </div>
          {myTickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2 text-text-disabled text-sm">
              <Shield className="w-8 h-8" />
              Aucun ticket assigné
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {myTickets.map((ticket) => {
                const p = priorities.find((pr) => pr.label === (ticket.priority === "URGENT" ? "Urgent" : "Normal"));
                return (
                  <li key={ticket.id}>
                    <Link
                      href={`/admin/tickets/${ticket.id}`}
                      className="flex items-start gap-3 px-5 py-3.5 hover:bg-primary-50 transition-colors"
                    >
                      <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${p?.color ?? "bg-border"}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text-primary truncate">{ticket.subject}</p>
                        <p className="text-xs text-text-secondary mt-0.5">{(ticket.reporterId && userNames[ticket.reporterId]) ?? "—"}</p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${p?.badge ?? "bg-border text-text-secondary"}`}>
                        {ticket.priority}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* Recent audit */}
      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="font-semibold text-text-primary">Activité récente</h3>
        </div>
        <AuditList entries={auditEntries} />
      </div>
    </div>
  );
}

/* ── Account Manager dashboard ──────────────────────────── */
export function AccountManagerDashboardView({ initialData }: { initialData: AccountManagerDashboardData }) {
  const { data } = usePolledData("account-manager-dashboard", fetchAccountManagerDashboardData, initialData);
  const { pendingShops, pendingTotal, approvedTotal, suspendedTotal, proUsersTotal, recentProUsers, auditEntries } = data ?? initialData;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-5xl mx-auto">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">Vue d'ensemble</h2>
          <p className="text-sm text-text-secondary mt-1">Dashboard Account Manager</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/shops?status=PENDING"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand text-white text-sm font-medium hover:bg-brand-hover transition-colors">
            <Store className="w-4 h-4" />
            Boutiques en attente
            {pendingTotal > 0 && (
              <span className="ml-1 bg-white/20 text-white text-xs font-bold px-1.5 rounded-full">{pendingTotal}</span>
            )}
          </Link>
          <Link href="/admin/users?role=PRO_SELLER"
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-text-secondary text-sm font-medium hover:border-brand hover:text-brand transition-colors">
            <Users className="w-4 h-4" /> Utilisateurs PRO
          </Link>
        </div>
      </div>

      {/* Alert */}
      {pendingTotal > 0 && (
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-warning-light border border-warning">
          <AlertCircle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-text-primary">
              {pendingTotal} boutique{pendingTotal > 1 ? "s" : ""} en attente d'approbation
            </p>
            <p className="text-xs text-text-secondary mt-0.5">
              Les vendeurs Pro attendent votre validation pour activer leur boutique.
            </p>
          </div>
          <Link href="/admin/shops?status=PENDING" className="text-sm text-warning font-semibold hover:underline whitespace-nowrap">
            Traiter →
          </Link>
        </div>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="En attente" value={pendingTotal}
          icon={Clock} iconColor={pendingTotal > 0 ? "text-warning" : "text-text-disabled"}
          iconBg={pendingTotal > 0 ? "bg-warning-light" : "bg-border"}
          href="/admin/shops?status=PENDING" />
        <StatCard label="Boutiques actives" value={approvedTotal}
          icon={Store} iconColor="text-success" iconBg="bg-success-light"
          href="/admin/shops?status=APPROVED" />
        <StatCard label="Boutiques suspendues" value={suspendedTotal}
          icon={Package} iconColor={suspendedTotal > 0 ? "text-error" : "text-text-disabled"}
          iconBg={suspendedTotal > 0 ? "bg-error-light" : "bg-border"}
          href="/admin/shops?status=SUSPENDED" />
        <StatCard label="Utilisateurs PRO" value={proUsersTotal}
          icon={Users} iconColor="text-brand" iconBg="bg-primary-50"
          href="/admin/users?role=PRO_SELLER" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending shops quick-list */}
        <div className="bg-white rounded-2xl border border-border overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h3 className="font-semibold text-text-primary">Demandes à traiter</h3>
            <Link href="/admin/shops?status=PENDING" className="text-xs text-brand hover:underline">
              Tout voir
            </Link>
          </div>
          {pendingShops.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2">
              <CheckCircle className="w-10 h-10 text-success" />
              <p className="text-sm text-text-secondary font-medium">File vide</p>
              <p className="text-xs text-text-disabled">Aucune boutique en attente</p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {pendingShops.map((shop) => (
                <li key={shop.id} className="px-5 py-3.5 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center text-brand font-bold text-sm shrink-0">
                    {shop.name[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link href={`/admin/shops/${shop.id}`}
                      className="text-sm font-medium text-text-primary hover:text-brand transition-colors truncate block">
                      {shop.name}
                    </Link>
                    <p className="text-xs text-text-disabled">
                      {shop.city ?? "—"} · {new Date(shop.createdAt).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                  <Link
                    href={`/admin/shops/${shop.id}`}
                    className="text-xs text-brand hover:underline whitespace-nowrap"
                  >
                    Examiner →
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Recent PRO users */}
        <div className="bg-white rounded-2xl border border-border overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h3 className="font-semibold text-text-primary">Utilisateurs PRO récents</h3>
            <Link href="/admin/users?role=PRO_SELLER" className="text-xs text-brand hover:underline">
              Tout voir
            </Link>
          </div>
          {recentProUsers.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-sm text-text-disabled">
              Aucun utilisateur PRO
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {recentProUsers.map((user) => (
                <li key={user.id} className="px-5 py-3.5 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-brand flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {user.displayName?.[0]?.toUpperCase() ?? "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">{user.displayName}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {user.kycStatus === "APPROVED" ? (
                        <span className="text-xs text-success flex items-center gap-0.5">
                          <Shield className="w-3 h-3" /> KYC vérifié
                        </span>
                      ) : (
                        <span className="text-xs text-text-disabled">Non vérifié</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    {user.status === "SUSPENDED" ? (
                      <span className="text-xs text-error font-medium">Suspendu</span>
                    ) : (
                      <span className="text-xs text-success font-medium">Actif</span>
                    )}
                    <p className="text-xs text-text-disabled">
                      {new Date(user.createdAt).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Activity log */}
      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="font-semibold text-text-primary">Activité récente</h3>
        </div>
        <AuditList entries={auditEntries} />
      </div>
    </div>
  );
}

/* ── Full admin dashboard ────────────────────────────────── */
export function FullAdminDashboard({ initialData, canViewFinance, isSuperAdmin }: {
  initialData: FullAdminDashboardData; canViewFinance: boolean; isSuperAdmin: boolean;
}) {
  const { data } = usePolledData(
    ["full-admin-dashboard", canViewFinance],
    () => fetchFullAdminDashboardData(canViewFinance),
    initialData,
  );
  const {
    usersTotal, pendingKyc, openTickets, pendingReports, pendingShops,
    activeAnnonces, approvedShops, finance, auditEntries,
  } = data ?? initialData;

  const urgentItems = [
    pendingKyc > 0 && { label: `${pendingKyc} KYC en attente`, href: "/admin/users?kycStatus=PENDING", color: "text-warning" },
    pendingShops > 0 && { label: `${pendingShops} boutique${pendingShops > 1 ? "s" : ""} à approuver`, href: "/admin/shops?status=PENDING", color: "text-warning" },
    openTickets > 0 && { label: `${openTickets} ticket${openTickets > 1 ? "s" : ""} ouvert${openTickets > 1 ? "s" : ""}`, href: "/admin/tickets?status=OPEN", color: "text-error" },
    pendingReports > 0 && { label: `${pendingReports} signalement${pendingReports > 1 ? "s" : ""} en attente`, href: "/admin/reports?status=PENDING", color: "text-error" },
  ].filter(Boolean) as Array<{ label: string; href: string; color: string }>;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-6xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-text-primary">Vue d'ensemble</h2>
        <p className="text-sm text-text-secondary mt-1">Tableau de bord administration Soukify</p>
      </div>

      {urgentItems.length > 0 && (
        <div className="bg-warning-light border border-warning rounded-2xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-text-primary">Actions requises</p>
            <ul className="mt-1.5 flex flex-wrap gap-x-5 gap-y-1">
              {urgentItems.map(({ label, href, color }) => (
                <li key={href}>
                  <Link href={href} className={`text-sm font-medium hover:underline ${color}`}>
                    → {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Utilisateurs"           value={usersTotal.toLocaleString("fr-FR")}
          icon={Users}     iconColor="text-brand"   iconBg="bg-primary-50"    href="/admin/users" />
        <StatCard label="KYC en attente"          value={pendingKyc}
          icon={Shield}    iconColor={pendingKyc  > 0 ? "text-warning" : "text-text-disabled"}
          iconBg={pendingKyc  > 0 ? "bg-warning-light" : "bg-border"}         href="/admin/users?kycStatus=PENDING" />
        <StatCard label="Boutiques en attente"    value={pendingShops}
          icon={Package}   iconColor={pendingShops > 0 ? "text-warning" : "text-text-disabled"}
          iconBg={pendingShops > 0 ? "bg-warning-light" : "bg-border"}        href="/admin/shops?status=PENDING" />
        <StatCard label="Annonces actives"        value={activeAnnonces.toLocaleString("fr-FR")}
          icon={Package}   iconColor="text-brand"   iconBg="bg-primary-50"    href="/admin/annonces?status=ACTIVE" />
        {canViewFinance ? (
          <>
            <StatCard label="Revenus du mois"     value={formatPrice(finance.monthlyRevenue ?? 0)}
              sub={`Total : ${formatPrice(finance.totalRevenue ?? 0)}`}
              icon={DollarSign} iconColor="text-gold" iconBg="bg-accent-100"  href="/admin/finance" />
            <StatCard label="Commissions du mois" value={formatPrice(finance.monthlyCommissions ?? 0)}
              icon={TrendingUp} iconColor="text-brand" iconBg="bg-primary-50" href="/admin/finance" />
          </>
        ) : (
          <>
            <StatCard label="Boutiques actives"   value={approvedShops.toLocaleString("fr-FR")}
              icon={Store}    iconColor="text-success" iconBg="bg-success-light" href="/admin/shops?status=APPROVED" />
            <StatCard label="Commandes complétées" value={(finance.completedOrders ?? 0).toLocaleString("fr-FR")}
              icon={ShoppingBag} iconColor="text-success" iconBg="bg-success-light" />
          </>
        )}
        <StatCard label="Tickets ouverts"         value={openTickets}
          icon={Clock}     iconColor={openTickets  > 0 ? "text-error" : "text-text-disabled"}
          iconBg={openTickets  > 0 ? "bg-error-light" : "bg-border"}          href="/admin/tickets?status=OPEN" />
        <StatCard label="Signalements en attente" value={pendingReports}
          icon={Flag}      iconColor={pendingReports > 0 ? "text-error" : "text-text-disabled"}
          iconBg={pendingReports > 0 ? "bg-error-light" : "bg-border"}        href="/admin/reports?status=PENDING" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-border p-5 space-y-3">
          <h3 className="font-semibold text-text-primary">Accès rapide</h3>
          <div className="grid grid-cols-2 gap-2">
            {[
              { href: "/admin/users",    icon: Users,       label: "Utilisateurs",  show: true },
              { href: "/admin/annonces", icon: Package,     label: "Annonces",      show: true },
              { href: "/admin/shops",    icon: ShoppingBag, label: "Boutiques",     show: true },
              { href: "/admin/tickets",  icon: Clock,       label: "Tickets",       show: true },
              { href: "/admin/reports",  icon: Flag,        label: "Signalements",  show: true },
              { href: "/admin/finance",  icon: DollarSign,  label: "Finance",       show: canViewFinance },
              { href: "/admin/config",   icon: FileCheck,   label: "Configuration", show: isSuperAdmin },
            ].filter((item) => item.show).map(({ href, icon: Icon, label }) => (
              <Link key={href} href={href}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-primary-50 hover:text-brand text-text-secondary transition-colors text-sm">
                <Icon className="w-4 h-4 shrink-0" />{label}
              </Link>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-border overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h3 className="font-semibold text-text-primary">Journal d'activité</h3>
            <Link href="/admin/audit" className="text-xs text-brand hover:underline">Tout voir</Link>
          </div>
          <AuditList entries={auditEntries} />
        </div>
      </div>
    </div>
  );
}
