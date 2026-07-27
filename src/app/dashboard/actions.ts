"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { serverGet, serverPost, serverPatch, serverDelete, serverUpload, ServerApiError } from "@/infrastructure/http/ApiServer";
import type { Annonce, MyProfile, NotificationsResponse, Order, PaginatedResponse, Shop, ShopStats, ShopSubscription } from "@/types/api";

/**
 * Next.js redacts the `.message` of any error a Server Action throws when
 * running a production build — a client `try/catch` around the action call
 * only ever sees "An error occurred in the Server Components render...",
 * never the real message. This is invisible in `next dev` (messages pass
 * through unsanitized there), which is why it went unnoticed all session —
 * confirmed by reproducing the exact same action against real prod vs local
 * dev with identical code (cf. HANDOFF_INFRA.md, 2026-07-27). The fix is to
 * never let the action throw across that boundary: catch internally and
 * return a result the caller can branch on directly.
 */
export type ActionResult<T> = { ok: true; data: T } | { ok: false; message: string };

async function toResult<T>(promise: Promise<T>): Promise<ActionResult<T>> {
  try {
    return { ok: true, data: await promise };
  } catch (e) {
    unstable_rethrow(e);
    return { ok: false, message: e instanceof ServerApiError ? e.message : "Une erreur est survenue." };
  }
}

/**
 * `Promise.allSettled`/`.catch()` capture rejections instead of propagating
 * them — including the special signal `redirect()` throws on a 401 (cf.
 * `handleUnauthorized` in ApiServer.ts). Without this, a session-expired
 * redirect would be silently swallowed instead of actually navigating to
 * /login. `unstable_rethrow` is a no-op for ordinary errors.
 */
function rethrowIfRedirected(results: PromiseSettledResult<unknown>[]): void {
  for (const r of results) {
    if (r.status === "rejected") unstable_rethrow(r.reason);
  }
}

/* ── Polled list fetchers (used by client components via SWR) ──────────
 * Same httpOnly-cookie-only model as admin/actions.ts — client components
 * poll these Server Actions instead of hitting the external API directly. */

export async function fetchMyProfile(): Promise<MyProfile | null> {
  return serverGet<MyProfile>("/users/me", 0).catch((e: unknown) => { unstable_rethrow(e); return null; });
}

export async function fetchMyOrders(qs: string): Promise<PaginatedResponse<Order>> {
  return serverGet<PaginatedResponse<Order>>(`/orders?${qs}`, 0);
}

export async function fetchMyAnnonces(qs: string): Promise<PaginatedResponse<Annonce>> {
  return serverGet<PaginatedResponse<Annonce>>(`/users/me/annonces?${qs}`, 0);
}

/**
 * The annonce management page (`/dashboard/annonces/:id`) previously fetched
 * `GET /annonces/:id` directly from the browser with `credentials: "include"`
 * — but the API authenticates via a Bearer token, not a cookie (it doesn't
 * set cookies at all), so that fetch was never actually authenticated. It
 * "worked" for an already-published (ACTIVE) annonce purely because that
 * data is public, but always 404'd for a DRAFT one, since the API correctly
 * hides unpublished annonces from unauthenticated requests — confirmed
 * against real prod (cf. HANDOFF_INFRA.md, 2026-07-27). Routed through the
 * same httpOnly-cookie server action pattern as everywhere else instead.
 */
export async function fetchMyAnnonceById(id: string): Promise<Annonce | null> {
  return serverGet<Annonce>(`/annonces/${id}`, 0).catch((e: unknown) => { unstable_rethrow(e); return null; });
}

/** `GET /conversations` — raw array, no pagination wrapper (cf. HANDOFF_INFRA.md). */
export interface DashboardConversation {
  id: string;
  annonceId: string;
  buyerId: string;
  sellerId: string;
  status: string;
  lastMessageAt: string | null;
  unreadCount: number;
}

export async function fetchMyConversations(): Promise<DashboardConversation[]> {
  return serverGet<DashboardConversation[]>("/conversations?limit=20", 0);
}

export async function fetchNotifications(): Promise<NotificationsResponse> {
  return serverGet<NotificationsResponse>("/notifications?limit=20", 0);
}

export async function markNotificationRead(id: string) {
  await serverPost(`/notifications/${id}/read`);
}

export async function markAllNotificationsRead() {
  await serverPost("/notifications/read-all");
}

export interface DashboardOverviewData {
  recentOrders: Order[];
  totalOrders: number;
  activeAnnonces: Annonce[];
  totalAnnonces: number;
  proShop: Shop | null;
  /**
   * Fresh from `GET /users/me`, not the JWT `roles` claim — the KYC banner
   * used to be gated purely on having the SELLER role in the (stale) JWT,
   * so it kept nagging an already-KYC-approved seller until they logged out
   * and back in (cf. HANDOFF_INFRA.md, 2026-07-27).
   */
  canSell: boolean;
}

export async function fetchDashboardOverview(sellerMode: boolean, isPro: boolean): Promise<DashboardOverviewData> {
  const results = await Promise.allSettled([
    serverGet<PaginatedResponse<Order>>("/orders?limit=5", 0),
    sellerMode ? serverGet<PaginatedResponse<Annonce>>("/users/me/annonces?limit=5&status=ACTIVE", 0) : Promise.resolve(null),
    isPro ? serverGet<{ shops: Shop[] }>("/pro/shops/me", 0) : Promise.resolve(null),
    sellerMode ? serverGet<MyProfile>("/users/me", 0) : Promise.resolve(null),
  ]);
  rethrowIfRedirected(results);
  const [orders, annonces, shopRes, profileRes] = results;

  return {
    recentOrders: orders.status === "fulfilled" ? orders.value.items : [],
    totalOrders: orders.status === "fulfilled" ? orders.value.total : 0,
    activeAnnonces: annonces.status === "fulfilled" && annonces.value ? annonces.value.items : [],
    totalAnnonces: annonces.status === "fulfilled" && annonces.value ? annonces.value.total : 0,
    proShop: shopRes.status === "fulfilled" && shopRes.value ? (shopRes.value.shops[0] ?? null) : null,
    canSell: profileRes.status === "fulfilled" && profileRes.value ? profileRes.value.canSell : false,
  };
}

export interface BoutiqueData {
  shop: Shop | null;
  stats: ShopStats | null;
  annonces: Annonce[];
  annoncesTotal: number;
  /** `ShopMember` only has `userId` — resolved via the public `GET /users/:id/profile` (no admin rights needed). */
  memberNames: Record<string, string>;
  /**
   * KYC is checked per-member, not per-shop (cf. HANDOFF_INFRA.md,
   * 2026-07-26) — a shop can be `ACTIVE` while the *current* logged-in
   * member still can't create/publish an annonce because their own KYC
   * isn't approved. Distinct from the shop's own status.
   */
  canSell: boolean;
}

export async function fetchBoutiqueData(needsAnnonces: boolean, annonceStatus: string): Promise<BoutiqueData> {
  const [shopRes, profile] = await Promise.all([
    serverGet<{ shops: Shop[] }>("/pro/shops/me", 0).catch((e: unknown) => { unstable_rethrow(e); return null; }),
    serverGet<MyProfile>("/users/me", 0).catch((e: unknown) => { unstable_rethrow(e); return null; }),
  ]);
  const shop = shopRes?.shops[0] ?? null;
  const canSell = profile?.canSell ?? false;

  if (!shop || shop.status !== "ACTIVE") {
    return { shop, stats: null, annonces: [], annoncesTotal: 0, memberNames: {}, canSell };
  }

  const members = shop.members ?? [];
  const results = await Promise.allSettled([
    needsAnnonces ? serverGet<ShopStats>(`/pro/shops/${shop.id}/stats`, 0) : Promise.resolve(null),
    needsAnnonces
      ? serverGet<PaginatedResponse<Annonce>>(`/users/me/annonces?limit=10${annonceStatus ? `&status=${annonceStatus}` : ""}`, 0)
      : Promise.resolve(null),
    ...members.map((m) => serverGet<{ displayName: string }>(`/users/${m.userId}/profile`, 60)),
  ]);
  rethrowIfRedirected(results);
  const [stats, annoncesRes, ...memberResults] = results;

  const memberNames: Record<string, string> = {};
  members.forEach((m, i) => {
    const r = memberResults[i];
    if (r.status === "fulfilled") memberNames[m.userId] = r.value.displayName;
  });

  return {
    shop,
    stats: stats.status === "fulfilled" ? stats.value : null,
    annonces: annoncesRes.status === "fulfilled" && annoncesRes.value ? annoncesRes.value.items : [],
    annoncesTotal: annoncesRes.status === "fulfilled" && annoncesRes.value ? annoncesRes.value.total : 0,
    memberNames,
    canSell,
  };
}

/* ── Annonces ────────────────────────────────────────────── */

/**
 * `CreateAnnonceDto` (confirmed against the real schema): `priceXAF` (not
 * `price`) and `negotiable` are both required — omitting either 400s. This
 * action previously sent `price` and never sent `negotiable` at all, so
 * every annonce creation through the real form failed (cf. HANDOFF_INFRA.md,
 * 2026-07-26). `shopId` is optional — links the annonce to a Pro shop the
 * caller is an active member of.
 */
export async function createAnnonce(data: {
  title: string;
  description: string;
  categoryId: string;
  type: "SALE" | "SERVICE";
  condition: string;
  priceXAF: number;
  negotiable: boolean;
  city: string;
  shopId?: string;
}): Promise<ActionResult<{ id: string }>> {
  /* POST /annonces returns { annonceId }, not the full Annonce object —
   * this previously read `.id` (always undefined), so createAnnonce()
   * silently returned { id: undefined }. Harmless for "save as draft"
   * (the id is never used), but "publish now" then called
   * publishAnnonce(undefined) -> POST /annonces/undefined/publish, which
   * crashed uncaught in production (cf. HANDOFF_INFRA.md, 2026-07-27). */
  const result = await toResult(serverPost<{ annonceId: string }>("/annonces", data));
  if (!result.ok) return result;
  revalidatePath("/dashboard/annonces");
  return { ok: true, data: { id: result.data.annonceId } };
}

export async function publishAnnonce(id: string): Promise<ActionResult<void>> {
  const result = await toResult(serverPost<void>(`/annonces/${id}/publish`));
  if (result.ok) revalidatePath("/dashboard/annonces");
  return result;
}

/* ── Boutique PRO ────────────────────────────────────────── */

/**
 * `SubmitProRequestDto` requires `name`, `slug`, `city` (not just `name`/
 * `description`) — omitting `slug`/`city` 400s. Response is
 * `{ shopId, message }`, not the full `Shop` object (same class of bug as
 * `createAnnonce` — cf. HANDOFF_INFRA.md, 2026-07-27).
 */
export async function createShop(data: { name: string; slug: string; city: string; description?: string }): Promise<ActionResult<{ id: string }>> {
  const result = await toResult(serverPost<{ shopId: string }>("/pro/shops", data));
  if (!result.ok) return result;
  revalidatePath("/dashboard/boutique");
  return { ok: true, data: { id: result.data.shopId } };
}

export async function updateShop(shopId: string, data: { name?: string; description?: string }): Promise<ActionResult<void>> {
  const result = await toResult(serverPatch<void>(`/pro/shops/${shopId}`, data));
  if (result.ok) revalidatePath("/dashboard/boutique");
  return result;
}

export async function changeSubscription(shopId: string, plan: ShopSubscription): Promise<ActionResult<void>> {
  const result = await toResult(serverPost<void>(`/pro/shops/${shopId}/subscription`, { plan }));
  if (result.ok) revalidatePath("/dashboard/boutique");
  return result;
}

export async function addStaffMember(shopId: string, phoneNumber: string): Promise<ActionResult<void>> {
  const result = await toResult(serverPost<void>(`/pro/shops/${shopId}/staff`, { phoneNumber }));
  if (result.ok) revalidatePath("/dashboard/boutique");
  return result;
}

export async function changeStaffRole(shopId: string, userId: string, role: "MANAGER" | "STAFF"): Promise<ActionResult<void>> {
  const result = await toResult(serverPatch<void>(`/pro/shops/${shopId}/staff/${userId}/role`, { role }));
  if (result.ok) revalidatePath("/dashboard/boutique");
  return result;
}

export async function removeStaffMember(shopId: string, userId: string): Promise<ActionResult<void>> {
  const result = await toResult(serverDelete<void>(`/pro/shops/${shopId}/staff/${userId}`));
  if (result.ok) revalidatePath("/dashboard/boutique");
  return result;
}

export async function uploadShopLogo(shopId: string, formData: FormData): Promise<ActionResult<void>> {
  const result = await toResult(serverUpload<void>(`/pro/shops/${shopId}/logo`, formData));
  if (result.ok) revalidatePath("/dashboard/boutique");
  return result;
}

export async function importShopCsv(shopId: string, formData: FormData): Promise<ActionResult<{ imported: number }>> {
  const result = await toResult(serverUpload<{ imported: number }>(`/pro/shops/${shopId}/annonces/import`, formData));
  if (!result.ok) return result;
  revalidatePath("/dashboard/boutique");
  revalidatePath("/dashboard/annonces");
  return { ok: true, data: result.data ?? { imported: 0 } };
}

export async function deleteOwnAnnonce(annonceId: string): Promise<ActionResult<void>> {
  const result = await toResult(serverDelete<void>(`/annonces/${annonceId}`));
  if (result.ok) {
    revalidatePath("/dashboard/boutique");
    revalidatePath("/dashboard/annonces");
  }
  return result;
}

/**
 * `UpdateAnnonceDto` uses `priceXAF`, not `price` (cf. HANDOFF_INFRA.md,
 * 2026-07-26). It also has **no `categoryId` field at all** (confirmed
 * against `annonce.controller.ts:30-38`, cf. HANDOFF_INFRA.md, 2026-07-27) —
 * sending it 400s with "property categoryId should not exist" since the API
 * whitelists DTO properties. The category can only be set at creation time.
 */
export async function updateAnnonce(id: string, data: {
  title?: string; description?: string; priceXAF?: number;
  condition?: string; city?: string;
}): Promise<ActionResult<void>> {
  const result = await toResult(serverPatch<void>(`/annonces/${id}`, data));
  if (result.ok) {
    revalidatePath(`/dashboard/annonces/${id}`);
    revalidatePath("/dashboard/annonces");
  }
  return result;
}

export async function renewAnnonce(id: string): Promise<ActionResult<void>> {
  const result = await toResult(serverPost<void>(`/annonces/${id}/renew`));
  if (result.ok) {
    revalidatePath(`/dashboard/annonces/${id}`);
    revalidatePath("/dashboard/annonces");
  }
  return result;
}

/**
 * `POST /annonces/:id/images` (`AnnonceController_addImage`) takes exactly
 * one file per call, field name `file` — not `images` (plural), and not
 * multiple files in one request. The old signature accepted a whole
 * FormData with several files all under "images", which the API rejected
 * outright ("Unexpected field") — every image upload attempt failed (cf.
 * HANDOFF_INFRA.md, 2026-07-27). Caller loops and calls this once per file.
 */
export async function uploadAnnonceImage(id: string, file: File): Promise<ActionResult<void>> {
  const formData = new FormData();
  formData.append("file", file);
  const result = await toResult(serverUpload<void>(`/annonces/${id}/images`, formData));
  if (result.ok) revalidatePath(`/dashboard/annonces/${id}`);
  return result;
}

/* ── Orders ──────────────────────────────────────────────── */

export async function confirmDelivery(orderId: string): Promise<ActionResult<void>> {
  const result = await toResult(serverPost<void>(`/orders/${orderId}/confirm-delivery`));
  if (result.ok) {
    revalidatePath(`/dashboard/orders/${orderId}`);
    revalidatePath("/dashboard/orders");
  }
  return result;
}

export async function cancelOrder(orderId: string): Promise<ActionResult<void>> {
  const result = await toResult(serverPost<void>(`/orders/${orderId}/cancel`));
  if (result.ok) {
    revalidatePath(`/dashboard/orders/${orderId}`);
    revalidatePath("/dashboard/orders");
  }
  return result;
}

export async function disputeOrder(orderId: string, reason?: string): Promise<ActionResult<void>> {
  const result = await toResult(serverPost<void>(`/orders/${orderId}/dispute`, reason ? { reason } : undefined));
  if (result.ok) {
    revalidatePath(`/dashboard/orders/${orderId}`);
    revalidatePath("/dashboard/orders");
  }
  return result;
}

/* ── Messages ────────────────────────────────────────────── */

export async function sendMessage(conversationId: string, content: string): Promise<ActionResult<void>> {
  const result = await toResult(serverPost<void>(`/conversations/${conversationId}/messages`, { content }));
  if (result.ok) revalidatePath(`/dashboard/messages/${conversationId}`);
  return result;
}

export async function markConversationRead(conversationId: string): Promise<ActionResult<void>> {
  const result = await toResult(serverPost<void>(`/conversations/${conversationId}/read`));
  if (result.ok) revalidatePath("/dashboard/messages");
  return result;
}

/* ── Profile ─────────────────────────────────────────────── */

export async function updateUserProfile(data: { name: string }): Promise<ActionResult<void>> {
  /* PATCH /users/me expects `displayName`, not `name` (cf. HANDOFF_INFRA.md,
   * confirmed against the DTO — same field GET /users/me returns). */
  const result = await toResult(serverPatch<void>("/users/me", { displayName: data.name }));
  if (result.ok) {
    revalidatePath("/dashboard/profile");
    revalidatePath("/dashboard");
  }
  return result;
}

export async function submitKyc(formData: FormData): Promise<ActionResult<void>> {
  const result = await toResult(serverUpload<void>("/auth/kyc", formData));
  if (result.ok) revalidatePath("/dashboard/profile");
  return result;
}
