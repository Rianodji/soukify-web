"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { MessageSquare, ShoppingBag, Phone } from "lucide-react";
import { createConversation, createOrder } from "./actions";

interface BuyActionsProps {
  annonceId: string;
  sellerId: string;
  sellerPhone?: string;
  price: number;
  city: string;
  isAuthenticated: boolean;
  isSeller: boolean;
}

export function BuyActions({ annonceId, sellerId, sellerPhone, price, city, isAuthenticated, isSeller }: BuyActionsProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

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
      try {
        const { id } = await createConversation(annonceId, sellerId);
        router.push(`/dashboard/messages?conversation=${id}`);
      } catch {
        toast.error("Impossible de contacter le vendeur. Réessayez.");
      }
    });
  }

  async function handleBuy() {
    if (!isAuthenticated) {
      requireAuth(`/annonces/${annonceId}`);
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        const { id } = await createOrder({ annonceId, sellerId, annoncePriceXAF: price, city });
        router.push(`/dashboard/orders/${id}`);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Une erreur est survenue.");
      }
    });
  }

  if (isSeller) {
    return (
      <p className="text-sm text-text-secondary text-center py-3">
        C&apos;est votre annonce.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {error && (
        <p className="text-sm text-error bg-error-light rounded-xl px-4 py-2.5">{error}</p>
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
