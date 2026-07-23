"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { serverGet, serverPost, serverPatch, serverDelete } from "@/infrastructure/http/ApiServer";
import { getSession } from "@/lib/session";

/**
 * `Promise.allSettled` captures a rejection instead of propagating it —
 * including the special signal `redirect()` throws on a 401 (cf.
 * `handleUnauthorized` in ApiServer.ts). Without this, a session-expired
 * redirect deep inside one of several parallel calls would be silently
 * swallowed instead of actually navigating to /login. `unstable_rethrow` is
 * a no-op for ordinary errors — only Next.js control-flow signals proceed.
 */
function rethrowIfRedirected(results: PromiseSettledResult<unknown>[]): void {
  for (const r of results) {
    if (r.status === "rejected") unstable_rethrow(r.reason);
  }
}
import type {
  UserRole, PaginatedResponse, AdminUser, Annonce, Report, Shop, Ticket,
  FinanceDashboard, PlatformConfig, AuditEntry,
} from "@/types/api";

/* ── Polled list fetchers (used by client components via SWR) ──────────
 * Thin re-exports of serverGet so client components can poll authenticated
 * admin endpoints without a cookie ever reaching the browser — same
 * httpOnly-cookie-only model as the rest of the app (cf. HANDOFF_INFRA.md). */

export async function fetchAdminUsers(qs: string): Promise<PaginatedResponse<AdminUser>> {
  return serverGet<PaginatedResponse<AdminUser>>(`/admin/users?${qs}`, 0);
}

export async function fetchAdminShops(qs: string): Promise<PaginatedResponse<Shop>> {
  return serverGet<PaginatedResponse<Shop>>(`/admin/shops?${qs}`, 0);
}

export async function fetchAdminTickets(qs: string): Promise<PaginatedResponse<Ticket>> {
  return serverGet<PaginatedResponse<Ticket>>(`/admin/tickets?${qs}`, 0);
}

export async function fetchAdminReports(qs: string): Promise<PaginatedResponse<Report>> {
  return serverGet<PaginatedResponse<Report>>(`/admin/reports?${qs}`, 0);
}

export async function fetchAdminAnnonces(qs: string): Promise<PaginatedResponse<Annonce>> {
  return serverGet<PaginatedResponse<Annonce>>(`/search/annonces?${qs}`, 0);
}

/* ── Admin dashboard stats (per role variant) ───────────────────────── */

export interface FinanceDashboardData {
  finance: Partial<FinanceDashboard>;
  config: Partial<PlatformConfig>;
  auditEntries: AuditEntry[];
}

export async function fetchFinanceDashboardData(): Promise<FinanceDashboardData> {
  let finance: Partial<FinanceDashboard> = {};
  let config: Partial<PlatformConfig> = {};
  let auditEntries: AuditEntry[] = [];

  rethrowIfRedirected(await Promise.allSettled([
    serverGet<FinanceDashboard>("/admin/finance/dashboard", 0).then((r) => { finance = r; }),
    serverGet<PlatformConfig>("/admin/config", 0).then((r) => { config = r; }),
    serverGet<PaginatedResponse<AuditEntry>>("/admin/audit?limit=8", 0).then((r) => { auditEntries = r.items; }),
  ]));

  return { finance, config, auditEntries };
}

export interface SupportDashboardData {
  urgentCount: number; highCount: number; mediumCount: number; lowCount: number;
  pendingReports: number;
  myTickets: Ticket[];
  auditEntries: AuditEntry[];
}

export async function fetchSupportDashboardData(userId?: string): Promise<SupportDashboardData> {
  let urgentCount = 0, highCount = 0, mediumCount = 0, lowCount = 0;
  let pendingReports = 0;
  let myTickets: Ticket[] = [];
  let auditEntries: AuditEntry[] = [];

  rethrowIfRedirected(await Promise.allSettled([
    serverGet<PaginatedResponse<Ticket>>("/admin/tickets?status=OPEN&priority=URGENT&limit=1", 0)
      .then((r) => { urgentCount = r.total; }),
    serverGet<PaginatedResponse<Ticket>>("/admin/tickets?status=OPEN&priority=HIGH&limit=1", 0)
      .then((r) => { highCount = r.total; }),
    serverGet<PaginatedResponse<Ticket>>("/admin/tickets?status=OPEN&priority=MEDIUM&limit=1", 0)
      .then((r) => { mediumCount = r.total; }),
    serverGet<PaginatedResponse<Ticket>>("/admin/tickets?status=OPEN&priority=LOW&limit=1", 0)
      .then((r) => { lowCount = r.total; }),
    serverGet<PaginatedResponse<Report>>("/admin/reports?status=PENDING&limit=1", 0)
      .then((r) => { pendingReports = r.total; }),
    userId
      ? serverGet<PaginatedResponse<Ticket>>(`/admin/tickets?assigneeId=${userId}&status=OPEN&limit=6`, 0)
          .then((r) => { myTickets = r.items; })
      : Promise.resolve(),
    serverGet<PaginatedResponse<AuditEntry>>("/admin/audit?limit=8", 0)
      .then((r) => { auditEntries = r.items; }),
  ]));

  return { urgentCount, highCount, mediumCount, lowCount, pendingReports, myTickets, auditEntries };
}

export interface AccountManagerDashboardData {
  pendingShops: Shop[];
  pendingTotal: number; approvedTotal: number; suspendedTotal: number; proUsersTotal: number;
  recentProUsers: AdminUser[];
  auditEntries: AuditEntry[];
}

export async function fetchAccountManagerDashboardData(): Promise<AccountManagerDashboardData> {
  let pendingShops: Shop[] = [];
  let pendingTotal = 0, approvedTotal = 0, suspendedTotal = 0, proUsersTotal = 0;
  let recentProUsers: AdminUser[] = [];
  let auditEntries: AuditEntry[] = [];

  rethrowIfRedirected(await Promise.allSettled([
    serverGet<PaginatedResponse<Shop>>("/admin/shops?status=PENDING&limit=6", 0)
      .then((r) => { pendingShops = r.items; pendingTotal = r.total; }),
    serverGet<PaginatedResponse<Shop>>("/admin/shops?status=APPROVED&limit=1", 0)
      .then((r) => { approvedTotal = r.total; }),
    serverGet<PaginatedResponse<Shop>>("/admin/shops?status=SUSPENDED&limit=1", 0)
      .then((r) => { suspendedTotal = r.total; }),
    serverGet<PaginatedResponse<AdminUser>>("/admin/users?role=PRO_SELLER&limit=1", 0)
      .then((r) => { proUsersTotal = r.total; }),
    serverGet<PaginatedResponse<AdminUser>>("/admin/users?role=PRO_SELLER&limit=6", 0)
      .then((r) => { recentProUsers = r.items; }),
    serverGet<PaginatedResponse<AuditEntry>>("/admin/audit?limit=8", 0)
      .then((r) => { auditEntries = r.items.filter((e) =>
        e.action.includes("SHOP") || e.action.includes("KYC") || e.action.includes("USER")
      ); }),
  ]));

  return { pendingShops, pendingTotal, approvedTotal, suspendedTotal, proUsersTotal, recentProUsers, auditEntries };
}

export interface FullAdminDashboardData {
  usersTotal: number; pendingKyc: number; openTickets: number; pendingReports: number;
  pendingShops: number; activeAnnonces: number; approvedShops: number;
  finance: Partial<FinanceDashboard>;
  auditEntries: AuditEntry[];
}

export async function fetchFullAdminDashboardData(canViewFinance: boolean): Promise<FullAdminDashboardData> {
  let usersTotal = 0;
  let pendingKyc = 0;
  let openTickets = 0;
  let pendingReports = 0;
  let pendingShops = 0;
  let activeAnnonces = 0;
  let approvedShops = 0;
  let finance: Partial<FinanceDashboard> = {};
  let auditEntries: AuditEntry[] = [];

  rethrowIfRedirected(await Promise.allSettled([
    serverGet<PaginatedResponse<AdminUser>>("/admin/users?limit=1", 0)
      .then((r) => { usersTotal = r.total; }),
    serverGet<PaginatedResponse<AdminUser>>("/admin/users?kycStatus=PENDING&limit=1", 0)
      .then((r) => { pendingKyc = r.total; }),
    serverGet<PaginatedResponse<Ticket>>("/admin/tickets?status=OPEN&limit=1", 0)
      .then((r) => { openTickets = r.total; }),
    serverGet<PaginatedResponse<Report>>("/admin/reports?status=PENDING&limit=1", 0)
      .then((r) => { pendingReports = r.total; }),
    serverGet<PaginatedResponse<Shop>>("/admin/shops?status=PENDING&limit=1", 0)
      .then((r) => { pendingShops = r.total; }),
    serverGet<PaginatedResponse<Annonce>>("/search/annonces?status=ACTIVE&limit=1", 0)
      .then((r) => { activeAnnonces = r.total; }),
    serverGet<PaginatedResponse<Shop>>("/admin/shops?status=APPROVED&limit=1", 0)
      .then((r) => { approvedShops = r.total; }),
    canViewFinance
      ? serverGet<FinanceDashboard>("/admin/finance/dashboard", 0).then((r) => { finance = r; })
      : Promise.resolve(),
    serverGet<PaginatedResponse<AuditEntry>>("/admin/audit?limit=10", 0)
      .then((r) => { auditEntries = r.items; }),
  ]));

  return { usersTotal, pendingKyc, openTickets, pendingReports, pendingShops, activeAnnonces, approvedShops, finance, auditEntries };
}

/* ── Users ───────────────────────────────────────────────── */

export async function approveKyc(userId: string) {
  await serverPost(`/admin/users/${userId}/kyc/approve`);
  revalidatePath("/admin/users");
}

export async function rejectKyc(userId: string) {
  await serverPost(`/admin/users/${userId}/kyc/reject`);
  revalidatePath("/admin/users");
}

export async function suspendUser(userId: string) {
  await serverPost(`/admin/users/${userId}/suspend`);
  revalidatePath("/admin/users");
}

export async function unsuspendUser(userId: string) {
  await serverPost(`/admin/users/${userId}/unsuspend`);
  revalidatePath("/admin/users");
}

export async function changeUserRole(userId: string, role: UserRole) {
  await serverPatch(`/admin/users/${userId}/role`, { role });
  revalidatePath("/admin/users");
}

/* ── Annonces ───────────────────────────────────────────── */

export async function deleteAnnonce(annonceId: string) {
  await serverDelete(`/annonces/${annonceId}`);
  revalidatePath("/admin/annonces");
}

/* ── Shops ───────────────────────────────────────────────── */

export async function approveShop(shopId: string) {
  await serverPost(`/admin/shops/${shopId}/approve`);
  revalidatePath("/admin/shops");
}

export async function rejectShop(shopId: string) {
  await serverPost(`/admin/shops/${shopId}/reject`);
  revalidatePath("/admin/shops");
}

export async function suspendShop(shopId: string) {
  await serverPost(`/admin/shops/${shopId}/suspend`);
  revalidatePath("/admin/shops");
}

export async function unsuspendShop(shopId: string) {
  await serverPost(`/admin/shops/${shopId}/unsuspend`);
  revalidatePath("/admin/shops");
}

/* ── Tickets ─────────────────────────────────────────────── */

export async function resolveTicket(ticketId: string) {
  await serverPost(`/admin/tickets/${ticketId}/resolve`);
  revalidatePath("/admin/tickets");
}

export async function assignTicketToSelf(ticketId: string) {
  const session = await getSession();
  if (!session) throw new Error("Non authentifié");
  await serverPost(`/admin/tickets/${ticketId}/assign`, { assigneeId: session.userId });
  revalidatePath("/admin/tickets");
}

export async function reopenTicket(ticketId: string) {
  await serverPost(`/admin/tickets/${ticketId}/reopen`);
  revalidatePath("/admin/tickets");
}

/* ── Reports ─────────────────────────────────────────────── */

export async function approveReport(reportId: string) {
  await serverPost(`/admin/reports/${reportId}/approve`);
  revalidatePath("/admin/reports");
}

export async function dismissReport(reportId: string) {
  await serverPost(`/admin/reports/${reportId}/dismiss`);
  revalidatePath("/admin/reports");
}

/* ── Tickets (create) ───────────────────────────────────── */

export async function createTicket(data: {
  subject: string;
  description: string;
  priority: string;
  userId?: string;
}): Promise<{ id: string }> {
  const ticket = await serverPost<{ id: string }>("/admin/tickets", data);
  revalidatePath("/admin/tickets");
  return { id: ticket.id };
}

/* ── Config ──────────────────────────────────────────────── */

export async function updateConfig(data: {
  commissionRatePct?: number;
  freeMaxAnnonces?: number;
  standardMaxAnnonces?: number;
  premiumMaxAnnonces?: number;
}) {
  await serverPatch("/admin/config", data);
  revalidatePath("/admin/config");
  revalidatePath("/admin");
}
