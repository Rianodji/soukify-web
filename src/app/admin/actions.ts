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
  FinanceDashboard, PlatformConfig, AuditEntry, PublicUserProfile,
} from "@/types/api";

/* ── Polled list fetchers (used by client components via SWR) ──────────
 * Thin re-exports of serverGet so client components can poll authenticated
 * admin endpoints without a cookie ever reaching the browser — same
 * httpOnly-cookie-only model as the rest of the app (cf. HANDOFF_INFRA.md). */

export async function fetchAdminUsers(qs: string): Promise<PaginatedResponse<AdminUser>> {
  return serverGet<PaginatedResponse<AdminUser>>(`/admin/users?${qs}`, 0);
}

/**
 * `GET /admin/users/:id` doesn't exist (404 — confirmed 2026-07-24, same gap
 * as `GET /admin/shops/:id`/`GET /admin/tickets/:id` had before those were
 * fixed, cf. HANDOFF_INFRA.md). Best-effort fallback: scan `GET /admin/users`
 * for a matching id — reliable at today's scale (~15 seeded accounts) but NOT
 * guaranteed once the user base grows past this page size.
 */
export async function fetchAdminUserById(id: string): Promise<AdminUser | null> {
  const list = await serverGet<PaginatedResponse<AdminUser>>("/admin/users?limit=200", 0);
  return list.items.find((u) => u.id === id) ?? null;
}

export async function fetchAdminShops(qs: string): Promise<PaginatedResponse<Shop>> {
  return serverGet<PaginatedResponse<Shop>>(`/admin/shops?${qs}`, 0);
}

/**
 * Bulk-resolves distinct user ids to their public profile.
 *
 * `GET /admin/users/:id` doesn't exist (404 — confirmed 2026-07-24, same gap
 * as `GET /admin/shops/:id` and `GET /admin/tickets/:id`, cf. HANDOFF_INFRA.md)
 * so per-user admin detail (phone/kycStatus/email) isn't resolvable here —
 * uses the public `GET /users/:id/profile` instead, which only has
 * `displayName`/`score`/`memberSince`. Bounded page sizes only.
 */
async function resolveUserProfiles(ids: Array<string | undefined>): Promise<Record<string, PublicUserProfile>> {
  const distinct = [...new Set(ids.filter((id): id is string => !!id))];
  const profiles = await Promise.all(
    distinct.map((id) => serverGet<PublicUserProfile>(`/users/${id}/profile`, 60).catch(() => null)),
  );
  const byId: Record<string, PublicUserProfile> = {};
  distinct.forEach((id, i) => { if (profiles[i]) byId[id] = profiles[i]!; });
  return byId;
}

export async function resolveUserNames(ids: Array<string | undefined>): Promise<Record<string, string>> {
  const profiles = await resolveUserProfiles(ids);
  return Object.fromEntries(Object.entries(profiles).map(([id, p]) => [id, p.displayName]));
}

export interface AdminTicketsData extends PaginatedResponse<Ticket> {
  /** `Ticket` only carries `reporterId`/`assigneeId` — resolved display names, keyed by userId. */
  userNames: Record<string, string>;
}

export async function fetchAdminTickets(qs: string): Promise<AdminTicketsData> {
  const res = await serverGet<PaginatedResponse<Ticket>>(`/admin/tickets?${qs}`, 0);
  const userNames = await resolveUserNames(res.items.flatMap((t) => [t.reporterId, t.assigneeId]));
  return { ...res, userNames };
}

export interface AdminReportsData extends PaginatedResponse<Report> {
  /** `Report` only carries `reporterId` — resolved reporter profiles, keyed by userId. */
  reporterProfiles: Record<string, PublicUserProfile>;
  /** For reports with `targetType === "ANNONCE"` — resolved titles, keyed by `targetId`. */
  annonceTitles: Record<string, string>;
}

export async function fetchAdminReports(qs: string): Promise<AdminReportsData> {
  const res = await serverGet<PaginatedResponse<Report>>(`/admin/reports?${qs}`, 0);
  const reporterProfiles = await resolveUserProfiles(res.items.map((r) => r.reporterId));

  const annonceIds = [...new Set(
    res.items.filter((r) => r.targetType === "ANNONCE").map((r) => r.targetId).filter((id): id is string => !!id),
  )];
  const annonces = await Promise.all(
    annonceIds.map((id) => serverGet<Annonce>(`/annonces/${id}`, 60).catch(() => null)),
  );
  const annonceTitles: Record<string, string> = {};
  annonceIds.forEach((id, i) => { if (annonces[i]) annonceTitles[id] = annonces[i]!.title; });

  return { ...res, reporterProfiles, annonceTitles };
}

/** `GET /search/annonces` embeds `seller: {id, displayName, isKYCVerified}` (added 2026-07-24, cf. HANDOFF_INFRA.md). */
export async function fetchAdminAnnonces(qs: string): Promise<PaginatedResponse<Annonce>> {
  return serverGet<PaginatedResponse<Annonce>>(`/search/annonces?${qs}`, 0);
}

/* ── Admin dashboard stats (per role variant) ───────────────────────── */

export interface FinanceDashboardData {
  finance: Partial<FinanceDashboard>;
  config: Partial<PlatformConfig>;
  auditEntries: AuditEntry[];
  /** `AuditEntry` only carries `actorId` — resolved display names, keyed by userId. */
  auditActorNames: Record<string, string>;
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
  const auditActorNames = await resolveUserNames(auditEntries.map((e) => e.actorId));

  return { finance, config, auditEntries, auditActorNames };
}

export interface SupportDashboardData {
  urgentCount: number; normalCount: number;
  pendingReports: number;
  myTickets: Ticket[];
  /** `Ticket` only carries `reporterId` — resolved display names, keyed by userId. */
  userNames: Record<string, string>;
  auditEntries: AuditEntry[];
  /** `AuditEntry` only carries `actorId` — resolved display names, keyed by userId. */
  auditActorNames: Record<string, string>;
}

export async function fetchSupportDashboardData(userId?: string): Promise<SupportDashboardData> {
  let urgentCount = 0, normalCount = 0;
  let pendingReports = 0;
  let myTickets: Ticket[] = [];
  let auditEntries: AuditEntry[] = [];

  rethrowIfRedirected(await Promise.allSettled([
    /* Real priority enum is `NORMAL | URGENT` only (cf. HANDOFF_INFRA.md, 2026-07-24). */
    serverGet<PaginatedResponse<Ticket>>("/admin/tickets?status=OPEN&priority=URGENT&limit=1", 0)
      .then((r) => { urgentCount = r.total; }),
    serverGet<PaginatedResponse<Ticket>>("/admin/tickets?status=OPEN&priority=NORMAL&limit=1", 0)
      .then((r) => { normalCount = r.total; }),
    serverGet<PaginatedResponse<Report>>("/admin/reports?status=PENDING&limit=1", 0)
      .then((r) => { pendingReports = r.total; }),
    userId
      ? serverGet<PaginatedResponse<Ticket>>(`/admin/tickets?assigneeId=${userId}&status=OPEN&limit=6`, 0)
          .then((r) => { myTickets = r.items; })
      : Promise.resolve(),
    serverGet<PaginatedResponse<AuditEntry>>("/admin/audit?limit=8", 0)
      .then((r) => { auditEntries = r.items; }),
  ]));

  const userNames = await resolveUserNames(myTickets.map((t) => t.reporterId));
  const auditActorNames = await resolveUserNames(auditEntries.map((e) => e.actorId));

  return { urgentCount, normalCount, pendingReports, myTickets, userNames, auditEntries, auditActorNames };
}

export interface AccountManagerDashboardData {
  pendingShops: Shop[];
  pendingTotal: number; approvedTotal: number; suspendedTotal: number; proUsersTotal: number;
  recentProUsers: AdminUser[];
  auditEntries: AuditEntry[];
  /** `AuditEntry` only carries `actorId` — resolved display names, keyed by userId. */
  auditActorNames: Record<string, string>;
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
    /* Only `user.*` audit actions exist today (cf. HANDOFF_INFRA.md,
     * 2026-07-27) — no dedicated SHOP/KYC action strings are emitted yet, so
     * this filter only ever matches USER-targeted entries in practice. Kept
     * broad (matches on `targetType` now, the real field) in case shop/KYC
     * auditing is added later without needing a web-side change. */
    serverGet<PaginatedResponse<AuditEntry>>("/admin/audit?limit=8", 0)
      .then((r) => { auditEntries = r.items.filter((e) =>
        ["SHOP", "USER"].includes(e.targetType) || e.action.toLowerCase().includes("kyc")
      ); }),
  ]));
  const auditActorNames = await resolveUserNames(auditEntries.map((e) => e.actorId));

  return { pendingShops, pendingTotal, approvedTotal, suspendedTotal, proUsersTotal, recentProUsers, auditEntries, auditActorNames };
}

export interface FullAdminDashboardData {
  usersTotal: number; pendingKyc: number; openTickets: number; pendingReports: number;
  pendingShops: number; activeAnnonces: number; approvedShops: number;
  finance: Partial<FinanceDashboard>;
  auditEntries: AuditEntry[];
  /** `AuditEntry` only carries `actorId` — resolved display names, keyed by userId. */
  auditActorNames: Record<string, string>;
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
  const auditActorNames = await resolveUserNames(auditEntries.map((e) => e.actorId));

  return { usersTotal, pendingKyc, openTickets, pendingReports, pendingShops, activeAnnonces, approvedShops, finance, auditEntries, auditActorNames };
}

/* ── Users ───────────────────────────────────────────────── */

export async function approveKyc(userId: string) {
  await serverPost(`/admin/users/${userId}/kyc/approve`);
  revalidatePath("/admin/users");
}

/** `RejectKycDto` requires a non-empty `reason` — omitting it 400s every time (confirmed, cf. HANDOFF_INFRA.md). */
export async function rejectKyc(userId: string, reason: string) {
  await serverPost(`/admin/users/${userId}/kyc/reject`, { reason });
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

/**
 * Confirmed against the real DTO (2026-07-24): roles are additive/removable,
 * not a single replaceable value — `{ role }` alone 400s ("action must be one
 * of the following values: add, remove"). The current dropdown UI only ever
 * grants a role; it can't yet express demoting someone (removing a role they
 * already hold), which would need its own affordance — noted in HANDOFF_INFRA.md.
 */
export async function changeUserRole(userId: string, role: UserRole, action: "add" | "remove" = "add") {
  await serverPatch(`/admin/users/${userId}/role`, { role, action });
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

/**
 * `POST /admin/tickets` DTO is `{ type: "DISPUTE"|"SUPPORT", subject,
 * description, orderId? }` — no `priority` (always starts `NORMAL`, cf.
 * `TicketPriority`), no `userId` (reporter is always the calling admin, not
 * settable). Sending the old `priority`/`userId` fields 400s: "property
 * priority should not exist" (confirmed, cf. HANDOFF_INFRA.md, 2026-07-24).
 * Response is `{ ticketId }`, not `{ id }`.
 */
export async function createTicket(data: {
  subject: string;
  description: string;
  type: "SUPPORT" | "DISPUTE";
  orderId?: string;
}): Promise<{ id: string }> {
  const ticket = await serverPost<{ ticketId: string }>("/admin/tickets", data);
  revalidatePath("/admin/tickets");
  return { id: ticket.ticketId };
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
