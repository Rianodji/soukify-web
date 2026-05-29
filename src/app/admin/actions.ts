"use server";

import { revalidatePath } from "next/cache";
import { serverPost, serverPatch, serverDelete } from "@/infrastructure/http/ApiServer";
import { getSession } from "@/lib/session";
import type { UserRole } from "@/types/api";

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
