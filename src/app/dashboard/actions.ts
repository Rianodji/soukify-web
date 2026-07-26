"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { serverGet, serverPost, serverPatch, serverDelete, serverUpload } from "@/infrastructure/http/ApiServer";
import type { Annonce, MyProfile, NotificationsResponse, Order, PaginatedResponse, Shop, ShopStats, ShopSubscription } from "@/types/api";

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
}

export async function fetchDashboardOverview(sellerMode: boolean, isPro: boolean): Promise<DashboardOverviewData> {
  const results = await Promise.allSettled([
    serverGet<PaginatedResponse<Order>>("/orders?limit=5", 0),
    sellerMode ? serverGet<PaginatedResponse<Annonce>>("/users/me/annonces?limit=5&status=ACTIVE", 0) : Promise.resolve(null),
    isPro ? serverGet<{ shops: Shop[] }>("/pro/shops/me", 0) : Promise.resolve(null),
  ]);
  rethrowIfRedirected(results);
  const [orders, annonces, shopRes] = results;

  return {
    recentOrders: orders.status === "fulfilled" ? orders.value.items : [],
    totalOrders: orders.status === "fulfilled" ? orders.value.total : 0,
    activeAnnonces: annonces.status === "fulfilled" && annonces.value ? annonces.value.items : [],
    totalAnnonces: annonces.status === "fulfilled" && annonces.value ? annonces.value.total : 0,
    proShop: shopRes.status === "fulfilled" && shopRes.value ? (shopRes.value.shops[0] ?? null) : null,
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
}): Promise<{ id: string }> {
  const annonce = await serverPost<Annonce>("/annonces", data);
  revalidatePath("/dashboard/annonces");
  return { id: annonce.id };
}

export async function publishAnnonce(id: string) {
  await serverPost(`/annonces/${id}/publish`);
  revalidatePath("/dashboard/annonces");
}

/* ── Boutique PRO ────────────────────────────────────────── */

export async function createShop(data: { name: string; description?: string }): Promise<{ id: string }> {
  const shop = await serverPost<Shop>("/pro/shops", data);
  revalidatePath("/dashboard/boutique");
  return { id: shop.id };
}

export async function updateShop(shopId: string, data: { name?: string; description?: string }) {
  await serverPatch(`/pro/shops/${shopId}`, data);
  revalidatePath("/dashboard/boutique");
}

export async function changeSubscription(shopId: string, plan: ShopSubscription) {
  await serverPost(`/pro/shops/${shopId}/subscription`, { plan });
  revalidatePath("/dashboard/boutique");
}

export async function addStaffMember(shopId: string, phoneNumber: string) {
  await serverPost(`/pro/shops/${shopId}/staff`, { phoneNumber });
  revalidatePath("/dashboard/boutique");
}

export async function changeStaffRole(shopId: string, userId: string, role: "MANAGER" | "STAFF") {
  await serverPatch(`/pro/shops/${shopId}/staff/${userId}/role`, { role });
  revalidatePath("/dashboard/boutique");
}

export async function removeStaffMember(shopId: string, userId: string) {
  await serverDelete(`/pro/shops/${shopId}/staff/${userId}`);
  revalidatePath("/dashboard/boutique");
}

export async function uploadShopLogo(shopId: string, formData: FormData): Promise<void> {
  await serverUpload(`/pro/shops/${shopId}/logo`, formData);
  revalidatePath("/dashboard/boutique");
}

export async function importShopCsv(shopId: string, formData: FormData): Promise<{ imported: number }> {
  const result = await serverUpload<{ imported: number }>(
    `/pro/shops/${shopId}/annonces/import`,
    formData,
  );
  revalidatePath("/dashboard/boutique");
  revalidatePath("/dashboard/annonces");
  return result ?? { imported: 0 };
}

export async function deleteOwnAnnonce(annonceId: string) {
  await serverDelete(`/annonces/${annonceId}`);
  revalidatePath("/dashboard/boutique");
  revalidatePath("/dashboard/annonces");
}

/** `UpdateAnnonceDto` uses `priceXAF`, not `price` (cf. HANDOFF_INFRA.md, 2026-07-26). */
export async function updateAnnonce(id: string, data: {
  title?: string; description?: string; priceXAF?: number;
  condition?: string; city?: string; categoryId?: string;
}) {
  await serverPatch(`/annonces/${id}`, data);
  revalidatePath(`/dashboard/annonces/${id}`);
  revalidatePath("/dashboard/annonces");
}

export async function renewAnnonce(id: string) {
  await serverPost(`/annonces/${id}/renew`);
  revalidatePath(`/dashboard/annonces/${id}`);
  revalidatePath("/dashboard/annonces");
}

export async function uploadAnnonceImages(id: string, formData: FormData): Promise<void> {
  await serverUpload(`/annonces/${id}/images`, formData);
  revalidatePath(`/dashboard/annonces/${id}`);
}

/* ── Orders ──────────────────────────────────────────────── */

export async function confirmDelivery(orderId: string) {
  await serverPost(`/orders/${orderId}/confirm-delivery`);
  revalidatePath(`/dashboard/orders/${orderId}`);
  revalidatePath("/dashboard/orders");
}

export async function cancelOrder(orderId: string) {
  await serverPost(`/orders/${orderId}/cancel`);
  revalidatePath(`/dashboard/orders/${orderId}`);
  revalidatePath("/dashboard/orders");
}

export async function disputeOrder(orderId: string, reason?: string) {
  await serverPost(`/orders/${orderId}/dispute`, reason ? { reason } : undefined);
  revalidatePath(`/dashboard/orders/${orderId}`);
  revalidatePath("/dashboard/orders");
}

/* ── Messages ────────────────────────────────────────────── */

export async function sendMessage(conversationId: string, content: string): Promise<void> {
  await serverPost(`/conversations/${conversationId}/messages`, { content });
  revalidatePath(`/dashboard/messages/${conversationId}`);
}

export async function markConversationRead(conversationId: string) {
  await serverPost(`/conversations/${conversationId}/read`);
  revalidatePath("/dashboard/messages");
}

/* ── Profile ─────────────────────────────────────────────── */

export async function updateUserProfile(data: { name: string }) {
  /* PATCH /users/me expects `displayName`, not `name` (cf. HANDOFF_INFRA.md,
   * confirmed against the DTO — same field GET /users/me returns). */
  await serverPatch("/users/me", { displayName: data.name });
  revalidatePath("/dashboard/profile");
  revalidatePath("/dashboard");
}

export async function submitKyc(formData: FormData): Promise<void> {
  await serverUpload("/auth/kyc", formData);
  revalidatePath("/dashboard/profile");
}
