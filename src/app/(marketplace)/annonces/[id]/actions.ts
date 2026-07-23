"use server";

import { serverPost } from "@/infrastructure/http/ApiServer";
import type { Conversation } from "@/types/api";

export async function createConversation(annonceId: string, sellerId: string): Promise<{ id: string }> {
  const conversation = await serverPost<Conversation>("/conversations", { annonceId, sellerId });
  return { id: conversation.id };
}

interface CreateOrderInput {
  annonceId: string;
  sellerId: string;
  annoncePriceXAF: number;
  city?: string;
}

export async function createOrder(input: CreateOrderInput): Promise<{ id: string }> {
  /* Retrait en main propre uniquement pour le MVP — pas de deliveryFeeXAF,
   * le champ a été retiré du contrat côté API (cf. HANDOFF_INFRA.md). */
  const order = await serverPost<{ orderId: string }>("/orders", input);
  return { id: order.orderId };
}
