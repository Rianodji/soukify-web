"use server";

import { revalidatePath } from "next/cache";
import { serverPost, serverPatch, serverDelete, serverUpload } from "@/infrastructure/http/ApiServer";
import type { Annonce, Shop, ShopSubscription } from "@/types/api";

/* ── Annonces ────────────────────────────────────────────── */

export async function createAnnonce(data: {
  title: string;
  description: string;
  categoryId: string;
  type: "SALE" | "SERVICE";
  condition: string;
  price: number;
  city: string;
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

export async function updateAnnonce(id: string, data: {
  title?: string; description?: string; price?: number;
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
  await serverPatch("/users/me", data);
  revalidatePath("/dashboard/profile");
  revalidatePath("/dashboard");
}

export async function submitKyc(formData: FormData): Promise<void> {
  await serverUpload("/auth/kyc", formData);
  revalidatePath("/dashboard/profile");
}
