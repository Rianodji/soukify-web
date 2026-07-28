"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { MessageSquare, ShoppingBag, Phone } from "lucide-react";
import { createConversation, createOrder, fetchPublicAnnonce } from "./actions";
import { usePolledData } from "@/hooks/usePolledData";

interface BuyActionsProps {
  annonceId: string;
  sellerId: string;
  sellerPhone?: string;
  city: string;
  isAuthenticated: boolean;
  isSeller: boolean;
  /** Stock restant — l'annonce peut passer en `SOLD` automatiquement à 0 (cf. HANDOFF_INFRA.md, 2026-07-27). */
  quantityAvailable: number;
  status: string;
}

export function BuyActions({
  annonceId, sellerId, sellerPhone, city, isAuthenticated, isSeller,
  quantityAvailable: initialQuantity, status: initialStatus,
}: BuyActionsProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);

  /*
   * Le stock/statut peut changer sans action de la personne qui regarde
   * l'écran (un autre acheteur peut épuiser le stock pendant qu'on est sur
   * la page) — sondage recommandé par l'API pour éviter qu'un acheteur
   * tente d'acheter un stock déjà épuisé avant de recharger (cf.
   * HANDOFF_INFRA.md, 2026-07-27).
   */
  const { data: live } = usePolledData(
    ["public-annonce", annonceId],
    () => fetchPublicAnnonce(annonceId),
    null,
    { refreshInterval: 20000 },
  );
  const quantityAvailable = live?.quantity ?? initialQuantity;
  const status = live?.status ?? initialStatus;

  function requireAuth(redirectPath: string) {
    router.push(`/login?redirect=${encodeURIComponent(redirectPath)}`);
  }

  async function handleContact() {
    if (!isAuthenticated) {
      requireAuth(`/annonces/${annonceId}`);
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await createConversation(annonceId, sellerId);
      if (result.ok) router.push(`/dashboard/messages?conversation=${result.data.id}`);
      else toast.error("Impossible de contacter le vendeur. Réessayez.");
    });
  }

  // Clampée au cas où le stock a diminué (sondage) depuis la sélection.
  const effectiveQuantity = Math.min(quantity, Math.max(quantityAvailable, 1));

  async function handleBuy() {
    if (!isAuthenticated) {
      requireAuth(`/annonces/${annonceId}`);
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await createOrder({ annonceId, sellerId, quantity: effectiveQuantity, city });
      if (result.ok) router.push(`/dashboard/orders/${result.data.id}`);
      else setError(result.message);
    });
  }

  if (isSeller) {
    return (
      <p className="text-sm text-text-secondary text-center py-3">
        C&apos;est votre annonce.
      </p>
    );
  }

  if (status !== "ACTIVE") {
    const label = status === "SOLD" ? "Cette annonce est vendue."
      : status === "ARCHIVED" ? "Cette annonce n'est plus en vente."
      : "Cette annonce n'est plus disponible.";
    return (
      <p className="text-sm text-text-secondary text-center py-3 bg-background rounded-xl">
        {label}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {error && (
        <p className="text-sm text-error bg-error-light rounded-xl px-4 py-2.5">{error}</p>
      )}

      {quantityAvailable > 1 && (
        <div className="flex items-center justify-between gap-3">
          <label className="text-sm text-text-secondary">Quantité</label>
          <select
            value={effectiveQuantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            className="h-9 px-3 rounded-lg border border-border bg-white text-sm text-text-primary focus:outline-none focus:border-brand"
          >
            {Array.from({ length: quantityAvailable }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
      )}

      <Button
        size="lg"
        variant="gold"
        className="w-full"
        onClick={handleBuy}
      >
        <ShoppingBag className="w-5 h-5" />
        Acheter maintenant
      </Button>

      <Button
        size="lg"
        variant="secondary"
        className="w-full"
        onClick={handleContact}
      >
        <MessageSquare className="w-5 h-5" />
        Contacter le vendeur
      </Button>

      {sellerPhone && (
        <a
          href={`tel:${sellerPhone}`}
          className="flex items-center justify-center gap-2 w-full h-11 rounded-lg border border-border text-text-secondary hover:border-brand hover:text-brand transition-colors text-sm font-medium"
        >
          <Phone className="w-4 h-4" />
          Appeler
        </a>
      )}

      <p className="text-xs text-text-disabled text-center">
        Retrait en main propre — livraison à venir
      </p>
    </div>
  );
}
