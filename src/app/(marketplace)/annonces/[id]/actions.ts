"use server";

import { unstable_rethrow } from "next/navigation";
import { serverPost, ServerApiError } from "@/infrastructure/http/ApiServer";
import type { Annonce } from "@/types/api";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3020/api/v1";

/**
 * `GET /annonces/:id` is `@Public()` — no auth needed, but routed through a
 * Server Action (rather than a direct client-side `fetch`) to avoid the
 * local-only CORS gap on the API (cf. HANDOFF_INFRA.md, 2026-07-26) and stay
 * consistent with the rest of the app. Used for polling so a buyer sees
 * `quantity`/`status` change (e.g. another buyer exhausting stock -> `SOLD`)
 * without a manual reload (API recommendation, cf. HANDOFF_INFRA.md, 2026-07-27).
 */
export async function fetchPublicAnnonce(id: string): Promise<Annonce | null> {
  try {
    const res = await fetch(`${API_BASE}/annonces/${id}`, { cache: "no-store" });
    if (!res.ok) return null;
    const body = await res.json() as { data: Annonce };
    return body.data ?? null;
  } catch {
    return null;
  }
}

/**
 * Next.js redacts the `.message` of any error a Server Action throws in a
 * production build (cf. HANDOFF_INFRA.md, 2026-07-27, `dashboard/actions.ts`)
 * — a buyer trying to purchase already-sold stock needs to see the real
 * "stock insuffisant" message, not a generic crash. Same fix applied here.
 */
type ActionResult<T> = { ok: true; data: T } | { ok: false; message: string };

async function toResult<T>(promise: Promise<T>): Promise<ActionResult<T>> {
  try {
    return { ok: true, data: await promise };
  } catch (e) {
    unstable_rethrow(e);
    return { ok: false, message: e instanceof ServerApiError ? e.message : "Une erreur est survenue." };
  }
}

/** `POST /conversations` field renamed `sellerId` -> `otherUserId` in `v1.0.21` (cf. HANDOFF_INFRA.md, 2026-07-28). */
export async function createConversation(annonceId: string, otherUserId: string): Promise<ActionResult<{ id: string }>> {
  const result = await toResult(serverPost<{ conversationId: string }>("/conversations", { annonceId, otherUserId }));
  if (!result.ok) return result;
  return { ok: true, data: { id: result.data.conversationId } };
}

interface CreateOrderInput {
  annonceId: string;
  sellerId: string;
  /** Requis (pas optionnel) — le prix est dérivé côté serveur depuis l'annonce × quantity, `annoncePriceXAF` n'est plus accepté (cf. HANDOFF_INFRA.md, 2026-07-27). */
  quantity: number;
  city?: string;
}

export async function createOrder(input: CreateOrderInput): Promise<ActionResult<{ id: string }>> {
  const result = await toResult(serverPost<{ orderId: string }>("/orders", input));
  if (!result.ok) return result;
  return { ok: true, data: { id: result.data.orderId } };
}
